import { Injectable, Logger } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { DatabaseService } from '../database/database.service.js';
import { CHATBOT_MENUS } from './chatbot-menus.js';
import { ChatbotSessionStore } from './chatbot-session.store.js';
import { ChatSessionState, UserSession } from './chatbot.types.js';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  /**
   * Durasi jeda hening bot setelah admin membalas manual (default 4 jam).
   */
  private readonly adminCooldownHours = Number(process.env.ADMIN_COOLDOWN_HOURS ?? 4);

  /**
   * Pengaturan hari & jam operasional (Waktu Indonesia Timur / WIT / UTC+9)
   * Hari kerja: Senin - Jumat (Monday - Friday)
   * Jam: 08.00 - 16.00 WIT
   */
  private readonly operationalStartHour = Number(process.env.OPERATIONAL_START_HOUR ?? 8);
  private readonly operationalEndHour = Number(process.env.OPERATIONAL_END_HOUR ?? 16);
  private readonly operationalTzOffset = Number(process.env.OPERATIONAL_TIMEZONE_OFFSET ?? 9);

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
   * Mengonversi digit nomor telepon menjadi format internasional Indonesia (+62).
   * Contoh:
   * 08123456789 -> +628123456789
   * 628123456789 -> +628123456789
   * 8123456789 -> +628123456789
   */
  public toPlus62(digits: string): string {
    if (digits.startsWith('62')) {
      return `+${digits}`;
    }
    if (digits.startsWith('0')) {
      return `+62${digits.slice(1)}`;
    }
    return `+62${digits}`;
  }

  /**
   * Mencari nomor telepon asli dari JID LID Baileys (lid-mapping-<lidUser>_reverse.json).
   */
  public resolveLidToPhone(lidJid: string): string | undefined {
    try {
      const lidUser = lidJid.split('@')[0].split(':')[0].replace(/\D/g, '');
      if (!lidUser) return undefined;

      const candidateDirs = [
        path.join(process.cwd(), 'auth_info'),
        path.join(process.cwd(), 'whatsapp-bot', 'auth_info'),
        path.resolve('auth_info'),
      ];

      for (const dir of candidateDirs) {
        const filePath = path.join(dir, `lid-mapping-${lidUser}_reverse.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8').trim();
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'string') {
            const digits = parsed.replace(/\D/g, '');
            if (digits.length >= 8 && digits.length <= 16) {
              return this.toPlus62(digits);
            }
          }
        }
      }
    } catch (err) {
      this.logger.debug(`Gagal membaca pemetaan LID: ${(err as Error).message}`);
    }
    return undefined;
  }

  /**
   * Mengubah format JID WhatsApp menjadi format nomor telepon Indonesia (+62).
   * Mendukung akun standar (@s.whatsapp.net), akun privasi LID (@lid) via reverse mapping Baileys,
   * serta alternatif altJid (remoteJidAlt / participantAlt).
   */
  public formatPhoneNumber(jid: string, altJid?: string): string | undefined {
    if (!jid) return undefined;

    // 1. Cek altJid jika disediakan dari Baileys (remoteJidAlt / participantAlt)
    if (altJid && (altJid.includes('@s.whatsapp.net') || !altJid.includes('@lid'))) {
      const rawAlt = altJid.split('@')[0].split(':')[0] || '';
      const digitsAlt = rawAlt.replace(/\D/g, '');
      if (digitsAlt.length >= 8 && digitsAlt.length <= 16) {
        return this.toPlus62(digitsAlt);
      }
    }

    // 2. Jika JID adalah akun standar WhatsApp (@s.whatsapp.net atau nomor telepon biasa)
    if (jid.includes('@s.whatsapp.net') || !jid.includes('@lid')) {
      const raw = jid.split('@')[0].split(':')[0] || '';
      const digits = raw.replace(/\D/g, '');
      if (digits.length >= 8 && digits.length <= 16) {
        return this.toPlus62(digits);
      }
    }

    // 3. Jika JID adalah akun LID (@lid), lakukan resolusi melalui pemetaan Baileys
    if (jid.includes('@lid')) {
      const resolved = this.resolveLidToPhone(jid);
      if (resolved) {
        return resolved;
      }
      if (altJid) {
        const altResolved = this.resolveLidToPhone(altJid);
        if (altResolved) {
          return altResolved;
        }
      }
    }

    // 4. Fallback jika ada digit yang menyerupai nomor telepon
    const fallbackDigits = jid.split('@')[0].split(':')[0].replace(/\D/g, '');
    if (fallbackDigits.length >= 9 && fallbackDigits.length <= 15 && !jid.includes('@lid')) {
      return this.toPlus62(fallbackDigits);
    }

    return undefined;
  }

  /**
   * Menormalisasi nomor telepon ke format Indonesia (+62).
   * Selalu fallback ke nomor WhatsApp orang yang sedang chat saat ini (jangan pernah pakai 'Tidak disertakan').
   */
  public normalizePhone(rawPhone: string, detectedPhone?: string): string {
    const phoneDigits = rawPhone.replace(/\D/g, '');
    if (phoneDigits.length >= 8 && phoneDigits.length <= 16) {
      return this.toPlus62(phoneDigits);
    }
    if (detectedPhone && detectedPhone.trim()) {
      const detectedDigits = detectedPhone.replace(/\D/g, '');
      if (detectedDigits.length >= 8) {
        return this.toPlus62(detectedDigits);
      }
      return detectedPhone.trim();
    }
    // Fallback utama jika nomor telepon tidak berhasil diekstrak (jangan pakai 'Tidak disertakan')
    return '+62 (WhatsApp)';
  }

  private parseLabeledTemplate(
    rawText: string,
    detailPattern: RegExp,
    detectedPhone?: string,
    fallbackName?: string,
    jid?: string,
  ): {
    reporterName: string;
    reporterPhone: string;
    address: string;
    detail: string;
    hasLabeledFields: boolean;
  } {
    const lines = rawText.split('\n');
    let name = '';
    let address = '';
    let phone = '';
    let detail = '';
    let hasLabeledFields = false;
    let currentField: 'name' | 'address' | 'phone' | 'detail' | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim().replace(/^\d+[.)]\s*/, '');

      const nameMatch = line.match(/^(?:nama\s*pemohon|nama\s*pemilik|nama\s*pelapor|nama)\s*[:=]\s*(.*)$/i);
      const addressMatch = line.match(/^(?:alamat\s*lengkap|alamat|lokasi)\s*[:=]\s*(.*)$/i);
      const phoneMatch = line.match(
        /^(?:no\.?\s*hp\s*yang\s*bisa\s*dihubungi|nomor\s*hp\s*yang\s*bisa\s*dihubungi|nomor\s*telepon|no\.?\s*telepon|no\.?\s*hp|nomor\s*hp|telepon|hp|kontak)\s*[:=]\s*(.*)$/i,
      );
      const detailMatch = line.match(detailPattern);

      if (nameMatch) {
        hasLabeledFields = true;
        name = nameMatch[1].trim();
        currentField = 'name';
      } else if (addressMatch) {
        hasLabeledFields = true;
        address = addressMatch[1].trim();
        currentField = 'address';
      } else if (phoneMatch) {
        hasLabeledFields = true;
        phone = phoneMatch[1].trim();
        currentField = 'phone';
      } else if (detailMatch) {
        hasLabeledFields = true;
        detail = detailMatch[1].trim();
        currentField = 'detail';
      } else if (currentField === 'detail' && line) {
        detail = detail ? `${detail}\n${line}` : line;
      }
    }

    const cleanName = name.replace(/^[.\s\-_]+|[.\s\-_]+$/g, '').trim();
    const finalName =
      cleanName && cleanName.length >= 2
        ? cleanName
        : fallbackName && fallbackName.trim() !== '.'
          ? fallbackName.trim()
          : 'Warga (WhatsApp)';

    const effectiveDetectedPhone =
      detectedPhone || (jid ? this.formatPhoneNumber(jid) : undefined);
    const finalPhone = this.normalizePhone(phone, effectiveDetectedPhone);
    const finalAddress = address && address.length >= 2 ? address : 'Kabupaten Mimika';

    return {
      reporterName: finalName,
      reporterPhone: finalPhone,
      address: finalAddress,
      detail,
      hasLabeledFields,
    };
  }

  /**
   * Melakukan parsing terhadap template pemeriksaan kesehatan:
   * 1. Nama pemohon:
   * 2. Alamat:
   * 3. No HP yang bisa dihubungi:
   * 4. Jenis dan jumlah hewan/produk:
   */
  public parseInspectionTemplate(
    rawText: string,
    detectedPhone?: string,
    fallbackName?: string,
    jid?: string,
  ): {
    reporterName: string;
    reporterPhone: string;
    address: string;
    description: string;
  } {
    const parsed = this.parseLabeledTemplate(
      rawText,
      /^(?:jenis\s*dan\s*jumlah\s*hewan\s*\/?\s*produk|jenis\s*dan\s*jumlah|jenis\s*hewan|jumlah\s*hewan|jumlah\s*ternak|komoditas|jumlah|keluhan|keterangan)\s*[:=]\s*(.*)$/i,
      detectedPhone,
      fallbackName,
      jid,
    );

    const commodity = parsed.hasLabeledFields ? parsed.detail : rawText.trim();
    const description = commodity
      ? `Permohonan Pemeriksaan Kesehatan - Jenis & Jumlah Hewan/Produk: ${commodity}`
      : '-';

    return {
      reporterName: parsed.reporterName,
      reporterPhone: parsed.reporterPhone,
      address: parsed.address,
      description,
    };
  }

  /**
   * Melakukan parsing pesan bantuan warga:
   * 1. Nama:
   * 2. Alamat:
   * 3. No HP yang bisa dihubungi:
   * 4. Keluhan/Kendala:
   */
  public parseBantuanMessage(
    rawText: string,
    detectedPhone?: string,
    fallbackName?: string,
    jid?: string,
  ): {
    reporterName: string;
    reporterPhone: string;
    address: string;
    description: string;
  } {
    const parsed = this.parseLabeledTemplate(
      rawText,
      /^(?:keluhan\s*\/?\s*kendala|kendala\s*\/?\s*keluhan|keluhan|keperluan|kendala|bantuan|laporan|masalah|keterangan|aduan)\s*[:=]\s*(.*)$/i,
      detectedPhone,
      fallbackName,
      jid,
    );

    const description = parsed.hasLabeledFields && parsed.detail ? parsed.detail : rawText.trim();

    return {
      reporterName: parsed.reporterName,
      reporterPhone: parsed.reporterPhone,
      address: parsed.address,
      description: description || '-',
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
   * Mengecek apakah saat ini berada dalam hari & jam operasional layanan:
   * Hari: Senin - Jumat (Monday - Friday)
   * Jam: 08.00 - 16.00 WIT (Waktu Indonesia Timur / UTC+9)
   */
  public isOperationalHours(currentDate = new Date()): boolean {
    const witTimestamp = currentDate.getTime() + this.operationalTzOffset * 60 * 60 * 1000;
    const witDate = new Date(witTimestamp);

    const day = witDate.getUTCDay(); // 0 = Minggu, 1 = Senin, ..., 5 = Jumat, 6 = Sabtu
    const isOperationalDay = day >= 1 && day <= 5;
    if (!isOperationalDay) {
      return false;
    }

    const hour = witDate.getUTCHours();
    return hour >= this.operationalStartHour && hour < this.operationalEndHour;
  }

  private resetToMainMenu(session: UserSession): string {
    const savedOffHoursUntil = session.metadata?.offHoursMenuUntil;
    session.metadata = savedOffHoursUntil ? { offHoursMenuUntil: savedOffHoursUntil } : {};
    session.state = ChatSessionState.MAIN_MENU;
    session.invalidAttempts = 0;
    session.lastBotReplyAt = Date.now();
    this.sessionStore.saveSession(session);
    return CHATBOT_MENUS.GREETING_HEADER(session.name, this.webUrl);
  }

  private enterMenuInformasi(session: UserSession): string {
    const savedOffHoursUntil = session.metadata?.offHoursMenuUntil;
    session.metadata = savedOffHoursUntil ? { offHoursMenuUntil: savedOffHoursUntil } : {};
    session.state = ChatSessionState.MENU_INFORMASI;
    session.invalidAttempts = 0;
    session.lastBotReplyAt = Date.now();
    this.sessionStore.saveSession(session);
    return CHATBOT_MENUS.MENU_INFORMASI;
  }

  private enterMenuBantuan(jid: string, session: UserSession, altJid?: string): string[] {
    const detectedPhone =
      (session.metadata?.detectedPhone as string | undefined) ||
      this.formatPhoneNumber(jid, altJid);
    const savedOffHoursUntil = session.metadata?.offHoursMenuUntil;
    session.metadata = {
      ...session.metadata,
      ...(detectedPhone ? { detectedPhone } : {}),
      ...(savedOffHoursUntil ? { offHoursMenuUntil: savedOffHoursUntil } : {}),
    };
    session.state = ChatSessionState.AWAITING_BANTUAN_MESSAGE;
    session.invalidAttempts = 0;
    session.lastBotReplyAt = Date.now();
    this.sessionStore.saveSession(session);
    return [CHATBOT_MENUS.MENU_BANTUAN_CHAT_1, CHATBOT_MENUS.MENU_BANTUAN_CHAT_2];
  }

  private handleInformasiSelection(
    jid: string,
    session: UserSession,
    choice: string,
    altJid?: string,
  ): string | string[] | null {
    switch (choice) {
      case '1':
        session.state = ChatSessionState.SUBMENU_INFORMASI_PERSYARATAN;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return [
          CHATBOT_MENUS.SUBMENU_INFORMASI_1_CHAT_1,
          CHATBOT_MENUS.SUBMENU_INFORMASI_1_CHAT_2,
        ];

      case '2': {
        const detectedPhone =
          (session.metadata?.detectedPhone as string | undefined) ||
          this.formatPhoneNumber(jid, altJid);
        const savedOffHoursUntil = session.metadata?.offHoursMenuUntil;
        session.metadata = {
          ...session.metadata,
          ...(detectedPhone ? { detectedPhone } : {}),
          ...(savedOffHoursUntil ? { offHoursMenuUntil: savedOffHoursUntil } : {}),
        };
        session.state = ChatSessionState.AWAITING_INSPECTION_TEMPLATE;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return [
          CHATBOT_MENUS.SUBMENU_INFORMASI_2_CHAT_1,
          CHATBOT_MENUS.SUBMENU_INFORMASI_2_CHAT_2,
        ];
      }

      case '3':
        session.state = ChatSessionState.SUBMENU_INFORMASI_ISIKHNAS;
        session.invalidAttempts = 0;
        session.lastBotReplyAt = Date.now();
        this.sessionStore.saveSession(session);
        return CHATBOT_MENUS.SUBMENU_INFORMASI_3_ISIKHNAS;

      default:
        return null;
    }
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
    altJid?: string,
  ): Promise<string | string[] | null> {
    const text = rawText.trim();
    if (!text) return null;

    const lower = text.toLowerCase();

    // Command khusus warga untuk memunculkan kembali menu utama,
    // bahkan jika bot sedang dalam status cooldown admin
    const isExplicitMenuCommand =
      lower === '#menu' ||
      lower === 'menu' ||
      lower === '0' ||
      lower === '#bot';

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
        return this.resetToMainMenu(session);
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

    // 3. Cek Hari & Jam Operasional (Senin - Jumat, 08.00 - 16.00 WIT)
    // WhatsApp Business otomatis menangani Away message di luar jam kerja.
    // Bot dijeda penuh KECUALI warga mengetik command #menu untuk akses menu mandiri.
    const isOperational = this.isOperationalHours();
    if (!isOperational) {
      const session = this.sessionStore.getSession(jid);
      const isOffHoursMenuSessionActive =
        session.metadata?.offHoursMenuUntil &&
        Date.now() <= Number(session.metadata.offHoursMenuUntil);

      if (lower === '#menu' || lower === 'menu') {
        this.logger.log(
          `[Off-Hours] Warga pada ${jid} meminta menu mandiri dengan command '${text}' di luar jam operasional.`,
        );
        this.sessionStore.resetAdminCooldown(jid);
        if (senderName && !session.name && senderName.trim() !== '.') {
          session.name = senderName.trim();
        }
        session.metadata = {
          ...session.metadata,
          offHoursMenuUntil: Date.now() + 15 * 60 * 1000,
        };
        return this.resetToMainMenu(session);
      }

      // Jika bukan #menu dan tidak ada sesi menu mandiri yang aktif, jeda bot (hening / return null)
      if (!isOffHoursMenuSessionActive) {
        this.logger.debug(
          `[Off-Hours Ignored] Pesan dari ${jid} diabaikan karena di luar jam operasional (Senin-Jumat 08.00-16.00 WIT). Away message ditangani oleh WhatsApp Business.`,
        );
        return null;
      }

      // Jika dalam sesi menu aktif tapi mengirim salam pembuka baru (misal: "halo"), abaikan agar tidak spam
      const isGreeting =
        lower === 'halo' ||
        lower === 'hai' ||
        lower === 'p' ||
        lower.startsWith('halo admin') ||
        lower.startsWith('selamat') ||
        lower.startsWith('assalam');

      if (isGreeting) {
        return null;
      }

      // Perpanjang sesi menu aktif setiap kali warga berinteraksi memilih menu yang valid
      session.metadata = {
        ...session.metadata,
        offHoursMenuUntil: Date.now() + 15 * 60 * 1000,
      };
    }

    const session = this.sessionStore.getSession(jid);
    if (senderName && !session.name && senderName.trim() !== '.') {
      session.name = senderName.trim();
    }
    session.lastUserMessageAt = Date.now();

    // Pastikan nomor HP terdeteksi dan tersimpan di metadata session
    const detectedPhone =
      (session.metadata?.detectedPhone as string | undefined) ||
      this.formatPhoneNumber(jid, altJid);
    if (detectedPhone && !session.metadata?.detectedPhone) {
      session.metadata = {
        ...session.metadata,
        detectedPhone,
      };
    }

    // 3. Alur Pengisian Template Layanan 2 (Informasi Pemeriksaan Kesehatan -> serviceType: INFORMASI)
    if (session.state === ChatSessionState.AWAITING_INSPECTION_TEMPLATE) {
      if (isExplicitMenuCommand) {
        return this.resetToMainMenu(session);
      }

      const effectivePhone =
        (session.metadata?.detectedPhone as string | undefined) ||
        this.formatPhoneNumber(jid, altJid);

      const parsed = this.parseInspectionTemplate(
        text,
        effectivePhone,
        session.name,
        jid,
      );

      const result = await this.databaseService.createWhatsappRecap({
        reporterName: parsed.reporterName,
        reporterPhone: parsed.reporterPhone,
        address: parsed.address,
        serviceType: 'INFORMASI',
        description: parsed.description,
      });

      session.metadata = {};
      session.name = parsed.reporterName;
      session.state = ChatSessionState.WAITING_FOR_ADMIN;
      session.adminLastRepliedAt = Date.now();
      session.invalidAttempts = 0;
      session.lastBotReplyAt = Date.now();
      this.sessionStore.saveSession(session);

      return CHATBOT_MENUS.REQUEST_CONFIRMATION(
        result.ticketNo,
        'INFORMASI',
        parsed.reporterName,
        parsed.reporterPhone,
        parsed.address,
      );
    }

    // 4. Alur Layanan Bantuan (Layanan 4 -> serviceType: BANTUAN)
    if (session.state === ChatSessionState.AWAITING_BANTUAN_MESSAGE) {
      if (isExplicitMenuCommand) {
        return this.resetToMainMenu(session);
      }

      if (text.length < 3) {
        return 'Silakan tuliskan kebutuhan atau kendala Anda secara singkat agar petugas kami dapat segera membantu:';
      }

      const effectivePhone =
        (session.metadata?.detectedPhone as string | undefined) ||
        this.formatPhoneNumber(jid, altJid);

      const parsed = this.parseBantuanMessage(
        text,
        effectivePhone,
        session.name,
        jid,
      );

      const result = await this.databaseService.createWhatsappRecap({
        reporterName: parsed.reporterName,
        reporterPhone: parsed.reporterPhone,
        address: parsed.address,
        serviceType: 'BANTUAN',
        description: parsed.description,
      });

      session.metadata = {};
      session.name = parsed.reporterName;
      session.state = ChatSessionState.WAITING_FOR_ADMIN;
      session.adminLastRepliedAt = Date.now();
      session.invalidAttempts = 0;
      session.lastBotReplyAt = Date.now();
      this.sessionStore.saveSession(session);

      return CHATBOT_MENUS.REQUEST_CONFIRMATION(
        result.ticketNo,
        'BANTUAN',
        parsed.reporterName,
        parsed.reporterPhone,
        parsed.address,
      );
    }

    // 5. Tangani pengguna yang sedang menunggu respon admin manusia
    if (session.state === ChatSessionState.WAITING_FOR_ADMIN) {
      if (isExplicitMenuCommand) {
        return this.resetToMainMenu(session);
      }
      this.sessionStore.saveSession(session);
      return null;
    }

    // 6. Perintah kembali ke Menu Utama atau salam pembuka
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
      return this.resetToMainMenu(session);
    }

    // 7. Submenu Layanan Informasi (1 - 3)
    if (
      session.state === ChatSessionState.MENU_INFORMASI ||
      session.state === ChatSessionState.SUBMENU_INFORMASI_PERSYARATAN ||
      session.state === ChatSessionState.SUBMENU_INFORMASI_ISIKHNAS
    ) {
      const infoReply = this.handleInformasiSelection(jid, session, lower, altJid);
      if (infoReply) {
        return infoReply;
      }

      session.invalidAttempts = (session.invalidAttempts || 0) + 1;
      this.sessionStore.saveSession(session);

      if (session.invalidAttempts < 3) {
        return CHATBOT_MENUS.INVALID_OPTION_HINT_INFORMASI;
      }

      session.state = ChatSessionState.WAITING_FOR_ADMIN;
      this.sessionStore.saveSession(session);
      return CHATBOT_MENUS.INVALID_LIMIT_REACHED;
    }

    // 8. Pilihan Menu Utama: 1. Informasi | 2. Bantuan
    if (lower === '1' || lower === 'informasi') {
      return this.enterMenuInformasi(session);
    }

    if (lower === '2' || lower === 'bantuan') {
      return this.enterMenuBantuan(jid, session, altJid);
    }

    // 9. Penanganan Input Tidak Valid (Anti-Loop Guard)
    session.invalidAttempts = (session.invalidAttempts || 0) + 1;
    this.sessionStore.saveSession(session);

    if (session.invalidAttempts < 3) {
      return CHATBOT_MENUS.INVALID_OPTION_HINT_MAIN;
    }

    session.state = ChatSessionState.WAITING_FOR_ADMIN;
    this.sessionStore.saveSession(session);
    return CHATBOT_MENUS.INVALID_LIMIT_REACHED;
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
