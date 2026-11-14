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
   * Mengubah format JID WhatsApp menjadi nomor telepon lokal.
   * Contoh: 6281234567890@s.whatsapp.net -> 081234567890
   */
  private formatPhoneNumber(jid: string): string {
    const raw = jid.split('@')[0] || '';
    if (raw.startsWith('62')) {
      return '0' + raw.slice(2);
    }
    return raw;
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
   * Mengembalikan string teks balasan, atau null jika bot harus hening (misal saat admin cooldown atau spam).
   */
  async handleIncomingMessage(jid: string, rawText: string, senderName?: string): Promise<string | null> {
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
    if (senderName && !session.name) {
      session.name = senderName;
    }
    session.lastUserMessageAt = Date.now();

    // 3. Tangani pengguna yang sedang dalam alur pengisian keluhan
    if (session.state === ChatSessionState.AWAITING_COMPLAINT_TEXT) {
      if (isExplicitMenuCommand) {
        session.state = ChatSessionState.MAIN_MENU;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
      }

      // Warga mengirimkan rincian keluhannya
      const reporterPhone = this.formatPhoneNumber(jid);
      const reporterName = session.name || senderName || 'Warga (WhatsApp)';

      // Simpan langsung ke database silantas.whatsapp_recaps
      const result = await this.databaseService.createComplaintRecap({
        reporterName,
        reporterPhone,
        address: 'Kabupaten Mimika',
        description: text,
      });

      // Alihkan state ke WAITING_FOR_ADMIN dan aktifkan cooldown agar admin menindaklanjuti
      session.state = ChatSessionState.WAITING_FOR_ADMIN;
      session.adminLastRepliedAt = Date.now();
      session.invalidAttempts = 0;
      session.lastBotReplyAt = Date.now();
      this.sessionStore.saveSession(session);

      return CHATBOT_MENUS.COMPLAINT_CONFIRMATION(result.ticketNo, reporterName, reporterPhone);
    }

    // 4. Tangani pengguna yang sedang menunggu respon admin manusia
    if (session.state === ChatSessionState.WAITING_FOR_ADMIN) {
      if (isExplicitMenuCommand) {
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

    // 5. Perintah kembali ke Menu Utama atau salam pembuka
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
      session.state = ChatSessionState.MAIN_MENU;
      session.invalidAttempts = 0;
      session.lastBotReplyAt = Date.now();
      this.sessionStore.saveSession(session);
      return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
    }

    // 6. Pilihan Menu Utama (1 - 4)
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

      case '4':
        // Warga memilih lapor keluhan / aduan
        session.state = ChatSessionState.AWAITING_COMPLAINT_TEXT;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.SUBMENU_4_PANDUAN_KELUHAN;
    }

    // 7. Penanganan Input Tidak Valid (Anti-Loop Guard)
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
