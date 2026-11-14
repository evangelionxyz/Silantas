import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { CHATBOT_MENUS } from './chatbot-menus.js';
import { ChatbotSessionStore } from './chatbot-session.store.js';
import { ChatSessionState } from './chatbot.types.js';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  /**
   * Durasi jeda hening bot setelah admin membalas manual (default 4 jam).
   */
  private readonly adminCooldownHours = Number(process.env.ADMIN_COOLDOWN_HOURS ?? 4);

  /**
   * Penyimpanan riwayat pesan untuk proteksi rate limiting per JID.
   */
  private readonly rateLimits = new Map<string, number[]>();
  private readonly maxMessagesPerWindow = 6;
  private readonly rateLimitWindowMs = 30 * 1000; // 30 detik

  constructor(
    private readonly sessionStore: ChatbotSessionStore,
    private readonly databaseService: DatabaseService,
  ) {}

  private get webUrl(): string {
    return (process.env.FRONTEND_WEB_URL || 'https://silantas.vercel.app').replace(/\/+$/, '');
  }

  /**
   * Mengubah format JID WhatsApp menjadi nomor telepon lokal yang valid.
   * Jika JID merupakan akun privasi/LID (@lid), mengembalikan undefined
   * karena LID bukan nomor telepon yang dapat dihubungi.
   */
  private formatPhoneNumber(jid: string): string | undefined {
    if (jid.includes('@lid') || jid.includes('lid')) {
      return undefined;
    }

    const raw = jid.split('@')[0] || '';
    const digits = raw.replace(/\D/g, '');

    if (digits.length < 9) {
      return undefined;
    }

    if (digits.startsWith('62')) {
      return '0' + digits.slice(2);
    }

    return digits.startsWith('0') ? digits : '0' + digits;
  }

  /**
   * Melakukan ekstraksi parsing terhadap teks template aduan yang diisi oleh warga:
   * Nama pemilik:
   * Nomor telepon:
   * Alamat lengkap:
   * Jumlah hewan:
   * Keluhan:
   */
  public parseComplaintTemplate(
    rawText: string,
    detectedPhone?: string,
    fallbackName?: string,
  ): {
    reporterName: string;
    reporterPhone: string;
    address: string;
    description: string;
  } {
    const lines = rawText.split('\n');
    let name = '';
    let phone = '';
    let address = '';
    let animalCount = '';
    let complaint = '';
    let currentField: 'name' | 'phone' | 'address' | 'animalCount' | 'complaint' | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      const nameMatch = line.match(/^(?:nama\s*pemilik|nama\s*pelapor|nama)\s*[:=]\s*(.*)$/i);
      const phoneMatch = line.match(/^(?:nomor\s*telepon|no\s*telepon|no\s*hp|nomor\s*hp|telepon|hp|kontak)\s*[:=]\s*(.*)$/i);
      const addressMatch = line.match(/^(?:alamat\s*lengkap|alamat|lokasi)\s*[:=]\s*(.*)$/i);
      const animalMatch = line.match(/^(?:jumlah\s*hewan|jumlah\s*ternak|populasi|jumlah)\s*[:=]\s*(.*)$/i);
      const complaintMatch = line.match(/^(?:keluhan|laporan|masalah|keterangan|aduan)\s*[:=]\s*(.*)$/i);

      if (nameMatch) {
        name = nameMatch[1].trim();
        currentField = 'name';
      } else if (phoneMatch) {
        phone = phoneMatch[1].trim();
        currentField = 'phone';
      } else if (addressMatch) {
        address = addressMatch[1].trim();
        currentField = 'address';
      } else if (animalMatch) {
        animalCount = animalMatch[1].trim();
        currentField = 'animalCount';
      } else if (complaintMatch) {
        complaint = complaintMatch[1].trim();
        currentField = 'complaint';
      } else if (currentField === 'complaint' && line) {
        complaint = complaint ? `${complaint}\n${line}` : line;
      }
    }

    // Jika tidak ada label yang cocok (warga mengetik keluhan bebas tanpa format template)
    if (!name && !complaint && !address && !animalCount) {
      complaint = rawText.trim();
    }

    // 1. Validasi / Sanitasi Nama
    const cleanName = name.replace(/^[.\s\-_]+|[.\s\-_]+$/g, '').trim();
    const finalName =
      cleanName && cleanName.length >= 2
        ? cleanName
        : fallbackName && fallbackName.trim() !== '.'
          ? fallbackName.trim()
          : 'Warga (WhatsApp)';

    // 2. Validasi / Sanitasi Nomor Telepon
    let finalPhone = '';
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length >= 8 && phoneDigits.length <= 16) {
      if (phoneDigits.startsWith('62')) {
        finalPhone = '0' + phoneDigits.slice(2);
      } else if (phoneDigits.startsWith('0')) {
        finalPhone = phoneDigits;
      } else {
        finalPhone = '0' + phoneDigits;
      }
    } else if (detectedPhone) {
      finalPhone = detectedPhone;
    } else {
      finalPhone = 'Tidak disertakan';
    }

    // 3. Sanitasi Alamat (Default ke Kabupaten Mimika jika kosong)
    const finalAddress = address && address.length >= 2 ? address : 'Kabupaten Mimika';

    // 4. Sanitasi Keterangan / Keluhan
    let finalDescription = '';
    if (animalCount && animalCount.trim()) {
      finalDescription = `Jumlah Hewan: ${animalCount.trim()}\nKeluhan: ${complaint || '-'}`;
    } else {
      finalDescription = complaint || '-';
    }

    return {
      reporterName: finalName,
      reporterPhone: finalPhone,
      address: finalAddress,
      description: finalDescription,
    };
  }

  /**
   * Dipanggil saat admin membalas chat secara manual dari HP atau WhatsApp Web.
   */
  handleAdminReply(jid: string): void {
    this.sessionStore.recordAdminReply(jid);
    this.logger.log(`Admin interlock aktif untuk ${jid}. Bot akan jeda selama ${this.adminCooldownHours} jam.`);
  }

  /**
   * Memproses pesan masuk dari masyarakat.
   * Mengembalikan string atau array string (jika mengirim beberapa chat berurutan),
   * atau null jika bot harus hening (misal saat admin cooldown atau spam).
   */
  async handleIncomingMessage(
    jid: string,
    rawText: string,
    senderName?: string,
  ): Promise<string | string[] | null> {
    const text = rawText.trim();
    if (!text) return null;

    const lower = text.toLowerCase();

    // Command khusus warga untuk memunculkan kembali menu layanan,
    // bahkan jika bot sedang dalam status cooldown admin
    const isExplicitMenuCommand =
      lower === '#menu' ||
      lower === 'menu' ||
      lower === '0' ||
      lower === '#bot' ||
      lower === 'bantuan';

    // 1. Cek Admin Interlock Cooldown (Spare waktu 4 jam)
    if (this.sessionStore.isAdminCooldownActive(jid, this.adminCooldownHours)) {
      if (isExplicitMenuCommand) {
        this.logger.log(
          `[Admin Interlock] Warga pada ${jid} meminta menu kembali dengan command '${text}'. Mereset cooldown.`,
        );
        this.sessionStore.resetAdminCooldown(jid);
        const session = this.sessionStore.getSession(jid);
        if (senderName && !session.name) {
          session.name = senderName;
        }
        session.metadata = {};
        session.state = ChatSessionState.MAIN_MENU;
        session.invalidAttempts = 0;
        session.lastUserMessageAt = Date.now();
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
      }

      const remainingMs = this.sessionStore.getRemainingCooldownMs(jid, this.adminCooldownHours);
      const remainingHours = (remainingMs / (1000 * 60 * 60)).toFixed(1);
      this.logger.debug(
        `[Ignored] Pesan dari ${jid} diabaikan karena admin baru saja membalas (sisa cooldown ~${remainingHours} jam).`,
      );
      return null;
    }

    // 2. Anti-Spam Rate Limiter (maks 6 pesan per 30 detik)
    if (this.isRateLimited(jid)) {
      this.logger.warn(`[Rate Limit] Pengirim ${jid} mengirim pesan terlalu cepat. Pesan diabaikan.`);
      return null;
    }

    const session = this.sessionStore.getSession(jid);
    if (senderName && !session.name && senderName.trim() !== '.') {
      session.name = senderName.trim();
    }
    session.lastUserMessageAt = Date.now();

    // 3. Alur Pengisian Template Aduan Keluhan (Kirim & parsing template 2 chat berurutan)
    if (session.state === ChatSessionState.AWAITING_COMPLAINT_TEMPLATE) {
      if (isExplicitMenuCommand) {
        session.metadata = {};
        session.state = ChatSessionState.MAIN_MENU;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
      }

      const parsed = this.parseComplaintTemplate(
        text,
        session.metadata?.detectedPhone as string | undefined,
        session.name,
      );

      // Simpan langsung ke database silantas.whatsapp_recaps
      const result = await this.databaseService.createComplaintRecap({
        reporterName: parsed.reporterName,
        reporterPhone: parsed.reporterPhone,
        address: parsed.address,
        description: parsed.description,
      });

      // Alihkan state ke WAITING_FOR_ADMIN dan aktifkan cooldown agar admin menindaklanjuti
      session.metadata = {};
      session.name = parsed.reporterName;
      session.state = ChatSessionState.WAITING_FOR_ADMIN;
      session.adminLastRepliedAt = Date.now();
      session.invalidAttempts = 0;
      session.lastBotReplyAt = Date.now();
      this.sessionStore.saveSession(session);

      return CHATBOT_MENUS.COMPLAINT_CONFIRMATION(
        result.ticketNo,
        parsed.reporterName,
        parsed.reporterPhone,
        parsed.address,
      );
    }

    // 3. Alur Form Keluhan: Langkah 1 - Pengisian Nama Lengkap (Wajib)
    if (session.state === ChatSessionState.COMPLAINT_AWAITING_NAME) {
      if (isExplicitMenuCommand) {
        session.metadata = {};
        session.state = ChatSessionState.MAIN_MENU;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
      }

      const cleanName = text.replace(/^[.\s\-_]+|[.\s\-_]+$/g, '').trim();
      if (cleanName.length < 2) {
        return CHATBOT_MENUS.COMPLAINT_INVALID_NAME;
      }

      session.metadata = { ...session.metadata, complaintName: cleanName };
      session.name = cleanName;
      session.state = ChatSessionState.COMPLAINT_AWAITING_PHONE;
      session.invalidAttempts = 0;
      session.lastBotReplyAt = Date.now();
      this.sessionStore.saveSession(session);

      const detected = session.metadata?.detectedPhone as string | undefined;
      return CHATBOT_MENUS.COMPLAINT_STEP_2_PHONE(cleanName, detected);
    }

    // 4. Alur Form Keluhan: Langkah 2 - Pengisian Nomor Telepon / Kontak
    if (session.state === ChatSessionState.COMPLAINT_AWAITING_PHONE) {
      if (isExplicitMenuCommand) {
        session.metadata = {};
        session.state = ChatSessionState.MAIN_MENU;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
      }

      let chosenPhone: string | undefined;
      const lowerInput = text.toLowerCase().trim();

      if (lowerInput === 'ok' || lowerInput === 'lewati' || lowerInput === 'default') {
        const detected = session.metadata?.detectedPhone as string | undefined;
        if (detected) {
          chosenPhone = detected;
        } else {
          return CHATBOT_MENUS.COMPLAINT_INVALID_PHONE;
        }
      } else {
        const digits = text.replace(/\D/g, '');
        if (digits.length >= 8 && digits.length <= 16) {
          if (digits.startsWith('62')) {
            chosenPhone = '0' + digits.slice(2);
          } else if (digits.startsWith('0')) {
            chosenPhone = digits;
          } else {
            chosenPhone = '0' + digits;
          }
        } else {
          return CHATBOT_MENUS.COMPLAINT_INVALID_PHONE;
        }
      }

      session.metadata = { ...session.metadata, complaintPhone: chosenPhone };
      session.state = ChatSessionState.COMPLAINT_AWAITING_DESCRIPTION;
      session.invalidAttempts = 0;
      session.lastBotReplyAt = Date.now();
      this.sessionStore.saveSession(session);

      return CHATBOT_MENUS.COMPLAINT_STEP_3_DESC(chosenPhone);
    }

    // 5. Alur Form Keluhan: Langkah 3 - Pengisian Rincian Keluhan
    if (session.state === ChatSessionState.COMPLAINT_AWAITING_DESCRIPTION) {
      if (isExplicitMenuCommand) {
        session.metadata = {};
        session.state = ChatSessionState.MAIN_MENU;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
      }

      if (text.length < 3) {
        return 'Rincian keluhan terlalu singkat. Silakan ketik isi keluhan Anda secara jelas:';
      }

      const reporterName =
        (session.metadata?.complaintName as string) || session.name || 'Warga (WhatsApp)';
      const reporterPhone =
        (session.metadata?.complaintPhone as string) ||
        this.formatPhoneNumber(jid) ||
        'Tidak disertakan';
      const address = 'Kabupaten Mimika';
      const description = text;

      // Simpan langsung ke database silantas.whatsapp_recaps
      const result = await this.databaseService.createComplaintRecap({
        reporterName,
        reporterPhone,
        address,
        description,
      });

      // Alihkan state ke WAITING_FOR_ADMIN dan aktifkan cooldown agar admin menindaklanjuti
      session.metadata = {};
      session.state = ChatSessionState.WAITING_FOR_ADMIN;
      session.adminLastRepliedAt = Date.now();
      session.invalidAttempts = 0;
      session.lastBotReplyAt = Date.now();
      this.sessionStore.saveSession(session);

      return CHATBOT_MENUS.COMPLAINT_CONFIRMATION(result.ticketNo, reporterName, reporterPhone);
    }

    // 6. Tangani pengguna yang sedang menunggu respon admin manusia
    if (session.state === ChatSessionState.WAITING_FOR_ADMIN) {
      if (isExplicitMenuCommand) {
        session.metadata = {};
        session.state = ChatSessionState.MAIN_MENU;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
      }
      // Biarkan warga mengetik pesan untuk dibaca admin manusia tanpa bot menginterupsi
      this.sessionStore.saveSession(session);
      return null;
    }

    // 7. Perintah kembali ke Menu Utama atau salam pembuka
    const isGreetingOrReset =
      isExplicitMenuCommand ||
      lower === 'halo' ||
      lower === 'hai' ||
      lower === 'p' ||
      lower === 'start' ||
      lower === 'mulai' ||
      lower.startsWith('halo admin') ||
      lower.startsWith('selamat') ||
      lower.startsWith('assalam');

    if (isGreetingOrReset || session.state === ChatSessionState.IDLE) {
      session.metadata = {};
      session.state = ChatSessionState.MAIN_MENU;
      session.invalidAttempts = 0;
      session.lastBotReplyAt = Date.now();
      this.sessionStore.saveSession(session);
      return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
    }

    // 8. Pilihan Menu Utama (1 - 4)
    switch (lower) {
      case '1':
        session.state = ChatSessionState.SUBMENU_PEMASUKAN;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.SUBMENU_1_PEMASUKAN;

      case '2':
        session.state = ChatSessionState.SUBMENU_PENGELUARAN;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.SUBMENU_2_PENGELUARAN;

      case '3':
        session.state = ChatSessionState.SUBMENU_RANTAI_DINGIN;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.SUBMENU_3_RANTAI_DINGIN;

      case '4': {
        // Warga memilih lapor keluhan / aduan: kirimkan 2 chat berurutan (instruksi + template)
        const detectedPhone = this.formatPhoneNumber(jid);
        session.metadata = { detectedPhone };
        session.state = ChatSessionState.AWAITING_COMPLAINT_TEMPLATE;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return [CHATBOT_MENUS.COMPLAINT_CHAT_1, CHATBOT_MENUS.COMPLAINT_CHAT_2];
      }
    }

    // 9. Penanganan Input Tidak Valid (Anti-Loop Guard)
    session.invalidAttempts = (session.invalidAttempts || 0) + 1;
    this.sessionStore.saveSession(session);

    if (session.invalidAttempts < 3) {
      return CHATBOT_MENUS.INVALID_OPTION_HINT;
    } else {
      // Jika salah berturut-turut 3 kali, hentikan loop dan alihkan ke admin
      session.state = ChatSessionState.WAITING_FOR_ADMIN;
      this.sessionStore.saveSession(session);
      return CHATBOT_MENUS.INVALID_LIMIT_REACHED;
    }
  }

  private isRateLimited(jid: string): boolean {
    const now = Date.now();
    const timestamps = this.rateLimits.get(jid) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.rateLimitWindowMs);

    if (validTimestamps.length >= this.maxMessagesPerWindow) {
      return true;
    }

    validTimestamps.push(now);
    this.rateLimits.set(jid, validTimestamps);
    return false;
  }
}
