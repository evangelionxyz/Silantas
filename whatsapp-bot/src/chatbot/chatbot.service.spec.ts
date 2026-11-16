import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service.js';
import { CHATBOT_MENUS } from './chatbot-menus.js';
import { ChatbotSessionStore } from './chatbot-session.store.js';
import { ChatbotService } from './chatbot.service.js';
import { ChatSessionState } from './chatbot.types.js';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let sessionStore: ChatbotSessionStore;
  let databaseService: DatabaseService;
  const testJid = '628123456789@s.whatsapp.net';

  const mockDatabaseService = {
    createWhatsappRecap: vi.fn().mockImplementation(async (data) => ({
      id: 'mock-uuid-1234',
      ticketNo: data.serviceType === 'INFORMASI' ? 'INF-TEST1234' : 'ADU-TEST1234',
    })),
    createComplaintRecap: vi.fn().mockImplementation(async () => ({
      id: 'mock-uuid-1234',
      ticketNo: 'ADU-TEST1234',
    })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.FRONTEND_WEB_URL = 'https://silantas.vercel.app';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        ChatbotSessionStore,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    sessionStore = module.get<ChatbotSessionStore>(ChatbotSessionStore);
    databaseService = module.get<DatabaseService>(DatabaseService);
    vi.spyOn(service, 'isOperationalHours').mockReturnValue(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(sessionStore).toBeDefined();
    expect(databaseService).toBeDefined();
  });

  describe('Menu Utama (Informasi & Bantuan) dan Submenu Layanan', () => {
    it('harus membalas dengan Menu Utama (1. Informasi, 2. Bantuan) dan menyertakan URL env', async () => {
      const reply = await service.handleIncomingMessage(testJid, 'Halo', 'Budi');
      expect(reply).toBeDefined();
      expect(reply).toContain('SI-LANTAS HEWAN MIMIKA');
      expect(reply).toContain('1. *Informasi*');
      expect(reply).toContain('2. *Bantuan*');
      expect(reply).toContain('https://silantas.vercel.app');
    });

    it('harus membuka Menu Informasi saat memilih angka 1', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      const reply = await service.handleIncomingMessage(testJid, '1');

      expect(reply).toBe(CHATBOT_MENUS.MENU_INFORMASI);
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.MENU_INFORMASI);
      expect(reply).toContain('persyaratan pemasukan dan pengeluaran');
      expect(reply).toContain('pemeriksaan kesehatan hewan');
      expect(reply).toContain('website Lalin.isikhnas');
    });

    it('harus menampilkan balasan 2 pesan persyaratan pemasukan dan pengeluaran (Layanan 1) saat memilih 1 di Menu Informasi', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      await service.handleIncomingMessage(testJid, '1');
      const reply = await service.handleIncomingMessage(testJid, '1');

      expect(Array.isArray(reply)).toBe(true);
      expect((reply as string[])[0]).toBe(CHATBOT_MENUS.SUBMENU_INFORMASI_1_CHAT_1);
      expect((reply as string[])[0]).toContain('Persyaratan pemasukan hewan');
      expect((reply as string[])[1]).toBe(CHATBOT_MENUS.SUBMENU_INFORMASI_1_CHAT_2);
      expect((reply as string[])[1]).toContain('Persyaratan pengeluaran hewan');
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.SUBMENU_INFORMASI_PERSYARATAN);
    });

    it('harus mengirimkan 2 pesan template untuk Layanan 2 dan menyimpan rekapan INFORMASI', async () => {
      await service.handleIncomingMessage(testJid, 'Halo', 'Budi');
      await service.handleIncomingMessage(testJid, '1');

      const stepReply = await service.handleIncomingMessage(testJid, '2');
      expect(Array.isArray(stepReply)).toBe(true);
      expect((stepReply as string[])[0]).toBe(CHATBOT_MENUS.SUBMENU_INFORMASI_2_CHAT_1);
      expect((stepReply as string[])[1]).toBe(CHATBOT_MENUS.SUBMENU_INFORMASI_2_CHAT_2);
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.AWAITING_INSPECTION_TEMPLATE);

      const filledTemplate =
        `1. Nama pemohon: Yohanes Maturbongs\n` +
        `2. Alamat: Kampung Naena Muktipura (SP 6)\n` +
        `3. No HP yang bisa dihubungi: 082199887766\n` +
        `4. Jenis dan jumlah hewan/produk: 5 ekor babi`;

      const confirmReply = await service.handleIncomingMessage(testJid, filledTemplate);

      expect(mockDatabaseService.createWhatsappRecap).toHaveBeenCalledWith({
        reporterName: 'Yohanes Maturbongs',
        reporterPhone: '+6282199887766',
        address: 'Kampung Naena Muktipura (SP 6)',
        serviceType: 'INFORMASI',
        description: 'Permohonan Pemeriksaan Kesehatan - Jenis & Jumlah Hewan/Produk: 5 ekor babi',
      });

      expect(confirmReply).toContain('PERMOHONAN INFORMASI DITERIMA');
      expect(confirmReply).toContain('INF-TEST1234');
      expect(confirmReply).toContain('Yohanes Maturbongs');
      expect(confirmReply).not.toMatch(/database|dashboard/i);

      const sessionAfter = sessionStore.getSession(testJid);
      expect(sessionAfter.state).toBe(ChatSessionState.WAITING_FOR_ADMIN);
      expect(sessionAfter.adminLastRepliedAt).toBeDefined();

      const followUp = await service.handleIncomingMessage(testJid, 'Mohon segera dibalas ya');
      expect(followUp).toBeNull();
    });

    it('bisa menggunakan nomor terdeteksi jika No HP kosong pada template Layanan 2', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      await service.handleIncomingMessage(testJid, '1');
      await service.handleIncomingMessage(testJid, '2');

      const filledWithMissing =
        `1. Nama pemohon: Mama Maria Omaleng\n` +
        `2. Alamat:\n` +
        `3. No HP yang bisa dihubungi:\n` +
        `4. Jenis dan jumlah hewan/produk: 2 ekor sapi`;

      await service.handleIncomingMessage(testJid, filledWithMissing);

      expect(mockDatabaseService.createWhatsappRecap).toHaveBeenCalledWith({
        reporterName: 'Mama Maria Omaleng',
        reporterPhone: '+628123456789',
        address: 'Kabupaten Mimika',
        serviceType: 'INFORMASI',
        description: 'Permohonan Pemeriksaan Kesehatan - Jenis & Jumlah Hewan/Produk: 2 ekor sapi',
      });
    });

    it('harus menampilkan panduan Lalin.isikhnas (Layanan 3) saat memilih 3 di Menu Informasi', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      await service.handleIncomingMessage(testJid, '1');
      const reply = await service.handleIncomingMessage(testJid, '3');

      expect(reply).toBe(CHATBOT_MENUS.SUBMENU_INFORMASI_3_ISIKHNAS);
      expect(reply).toContain('https://share.google/KJDES3yGAFbIrpuhA');
      expect(reply).toContain('+6281141112269');
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.SUBMENU_INFORMASI_ISIKHNAS);
    });

    it('harus mengirimkan 2 pesan template Bantuan dan menyimpan rekapan BANTUAN', async () => {
      await service.handleIncomingMessage(testJid, 'Halo', 'Budi');
      const promptReply = await service.handleIncomingMessage(testJid, '2');

      expect(Array.isArray(promptReply)).toBe(true);
      expect((promptReply as string[])[0]).toBe(CHATBOT_MENUS.MENU_BANTUAN_CHAT_1);
      expect((promptReply as string[])[0]).toContain('+6281141112269');
      expect((promptReply as string[])[1]).toBe(CHATBOT_MENUS.MENU_BANTUAN_CHAT_2);
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.AWAITING_BANTUAN_MESSAGE);

      const confirmReply = await service.handleIncomingMessage(
        testJid,
        '1. Nama: Budi Santoso\n' +
          '2. Alamat: SP 2 Timika\n' +
          '3. No HP yang bisa dihubungi: 081244556677\n' +
          '4. Keluhan/Kendala: Saya butuh panduan pendaftaran akun iSIKHNAS',
      );

      expect(mockDatabaseService.createWhatsappRecap).toHaveBeenCalledWith({
        reporterName: 'Budi Santoso',
        reporterPhone: '+6281244556677',
        address: 'SP 2 Timika',
        serviceType: 'BANTUAN',
        description: 'Saya butuh panduan pendaftaran akun iSIKHNAS',
      });

      expect(confirmReply).toContain('PERMOHONAN BANTUAN DITERIMA');
      expect(confirmReply).toContain('ADU-TEST1234');
      expect(confirmReply).not.toMatch(/database|dashboard/i);
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.WAITING_FOR_ADMIN);
    });

    it('harus fallback nomor HP ke pengirim saat ini jika warga hanya kirim teks singkat tanpa nomor', async () => {
      await service.handleIncomingMessage(testJid, 'Halo', 'El');
      await service.handleIncomingMessage(testJid, '2');

      const confirmReply = await service.handleIncomingMessage(testJid, 'Tes');

      expect(mockDatabaseService.createWhatsappRecap).toHaveBeenCalledWith({
        reporterName: 'El',
        reporterPhone: '+628123456789',
        address: 'Kabupaten Mimika',
        serviceType: 'BANTUAN',
        description: 'Tes',
      });

      expect(confirmReply).toContain('PERMOHONAN BANTUAN DITERIMA');
      expect(confirmReply).toContain('Nama: *El*');
      expect(confirmReply).toContain('No. HP: *+628123456789*');
      expect(confirmReply).not.toContain('Tidak disertakan');
      expect(confirmReply).not.toContain('tidak disertai');
    });

    it('harus kembali ke Menu Utama saat mengetik 0 dari submenu', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      await service.handleIncomingMessage(testJid, '1');
      await service.handleIncomingMessage(testJid, '3');
      const reply = await service.handleIncomingMessage(testJid, '0');

      expect(reply).toContain('1. *Informasi*');
      expect(reply).toContain('2. *Bantuan*');
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.MAIN_MENU);
    });
  });

  describe('Admin Interlock & Cooldown (Spare Waktu 4 Jam)', () => {
    it('harus diam (return null) setelah admin membalas manual', async () => {
      const reply1 = await service.handleIncomingMessage(testJid, 'Halo admin');
      expect(reply1).not.toBeNull();

      service.handleAdminReply(testJid);

      const replyAfterAdmin = await service.handleIncomingMessage(testJid, 'Terima kasih banyak pak admin');
      expect(replyAfterAdmin).toBeNull();
    });

    it('harus aktif kembali setelah spare waktu 4 jam telah lewat', async () => {
      const fourAndHalfHoursAgo = Date.now() - 4.5 * 60 * 60 * 1000;
      const session = sessionStore.getSession(testJid);
      session.adminLastRepliedAt = fourAndHalfHoursAgo;
      session.state = ChatSessionState.MUTED_BY_ADMIN;
      sessionStore.saveSession(session);

      const reply = await service.handleIncomingMessage(testJid, 'Halo, saya mau tanya lagi');
      expect(reply).not.toBeNull();
      expect(reply).toContain('1. *Informasi*');
    });

    it('tetap membisu jika waktu baru berjalan 2 jam (< 4 jam)', async () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      const session = sessionStore.getSession(testJid);
      session.adminLastRepliedAt = twoHoursAgo;
      session.state = ChatSessionState.MUTED_BY_ADMIN;
      sessionStore.saveSession(session);

      const reply = await service.handleIncomingMessage(testJid, 'Apakah dokumen saya sudah selesai?');
      expect(reply).toBeNull();
    });

    it('harus memunculkan kembali menu jika warga mengetik command #menu saat masih dalam cooldown admin', async () => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const session = sessionStore.getSession(testJid);
      session.adminLastRepliedAt = tenMinutesAgo;
      session.state = ChatSessionState.MUTED_BY_ADMIN;
      sessionStore.saveSession(session);

      const reply = await service.handleIncomingMessage(testJid, '#menu');
      expect(reply).not.toBeNull();
      expect(reply).toContain('1. *Informasi*');

      const updatedSession = sessionStore.getSession(testJid);
      expect(updatedSession.state).toBe(ChatSessionState.MAIN_MENU);
      expect(updatedSession.adminLastRepliedAt).toBeUndefined();

      const infoMenu = await service.handleIncomingMessage(testJid, '1');
      expect(infoMenu).toBe(CHATBOT_MENUS.MENU_INFORMASI);
    });

    it('harus memunculkan kembali menu jika warga mengetik 0 saat masih dalam cooldown admin', async () => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const session = sessionStore.getSession(testJid);
      session.adminLastRepliedAt = tenMinutesAgo;
      session.state = ChatSessionState.MUTED_BY_ADMIN;
      sessionStore.saveSession(session);

      const reply = await service.handleIncomingMessage(testJid, '0');
      expect(reply).not.toBeNull();
      expect(reply).toContain('1. *Informasi*');
    });
  });

  describe('Proteksi Anti-Spam & Input Tidak Valid', () => {
    it('memberikan petunjuk ramah saat input tidak valid di menu utama < 3 kali', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      const invalid1 = await service.handleIncomingMessage(testJid, 'xyz123');

      expect(invalid1).toBe(CHATBOT_MENUS.INVALID_OPTION_HINT_MAIN);
    });

    it('memberikan petunjuk ramah saat input tidak valid di menu informasi < 3 kali', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      await service.handleIncomingMessage(testJid, '1');
      const invalid1 = await service.handleIncomingMessage(testJid, '4');

      expect(invalid1).toBe(CHATBOT_MENUS.INVALID_OPTION_HINT_INFORMASI);
    });

    it('menghentikan spam dan mengalihkan ke admin setelah 3 kali input salah berturut-turut', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      await service.handleIncomingMessage(testJid, 'salah1');
      await service.handleIncomingMessage(testJid, 'salah2');
      const invalid3 = await service.handleIncomingMessage(testJid, 'salah3');

      expect(invalid3).toBe(CHATBOT_MENUS.INVALID_LIMIT_REACHED);

      const session = sessionStore.getSession(testJid);
      expect(session.state).toBe(ChatSessionState.WAITING_FOR_ADMIN);

      const nextMsg = await service.handleIncomingMessage(testJid, 'masih salah');
      expect(nextMsg).toBeNull();
    });
  });

  describe('Hari & Jam Operasional Bot (Senin - Jumat 08.00 - 16.00 WIT)', () => {
    it('isOperationalHours harus mengembalikan true pada hari kerja (Senin-Jumat) antara jam 08.00 - 15.59 WIT', () => {
      vi.spyOn(service, 'isOperationalHours').mockRestore();

      // Senin jam 08.00 WIT = Minggu 23.00 UTC
      expect(service.isOperationalHours(new Date('2026-11-15T23:00:00Z'))).toBe(true);

      // Senin jam 12.00 WIT = Senin 03.00 UTC
      expect(service.isOperationalHours(new Date('2026-11-16T03:00:00Z'))).toBe(true);

      // Jumat jam 15.59 WIT = Jumat 06.59 UTC
      expect(service.isOperationalHours(new Date('2026-11-20T06:59:00Z'))).toBe(true);
    });

    it('isOperationalHours harus mengembalikan false di luar jam operasional atau akhir pekan', () => {
      vi.spyOn(service, 'isOperationalHours').mockRestore();

      // Senin jam 07.59 WIT (belum buka)
      expect(service.isOperationalHours(new Date('2026-11-15T22:59:00Z'))).toBe(false);

      // Senin jam 16.00 WIT (sudah tutup)
      expect(service.isOperationalHours(new Date('2026-11-16T07:00:00Z'))).toBe(false);

      // Sabtu jam 10.00 WIT (akhir pekan)
      expect(service.isOperationalHours(new Date('2026-11-21T01:00:00Z'))).toBe(false);

      // Minggu jam 12.00 WIT (akhir pekan)
      expect(service.isOperationalHours(new Date('2026-11-22T03:00:00Z'))).toBe(false);
    });

    it('harus menjeda bot (return null) di luar jam operasional saat menerima pesan biasa (Halo)', async () => {
      vi.spyOn(service, 'isOperationalHours').mockReturnValue(false);

      const reply = await service.handleIncomingMessage(testJid, 'Halo', 'Budi');
      expect(reply).toBeNull();
    });

    it('harus tetap merespon menu utama saat warga mengetik #menu di luar jam operasional', async () => {
      vi.spyOn(service, 'isOperationalHours').mockReturnValue(false);

      const reply = await service.handleIncomingMessage(testJid, '#menu', 'Budi');
      expect(reply).not.toBeNull();
      expect(reply).toContain('SI-LANTAS HEWAN MIMIKA');
      expect(reply).toContain('1. *Informasi*');
      expect(reply).toContain('2. *Bantuan*');
    });

    it('harus mengizinkan navigasi menu mandiri setelah warga mengetik #menu di luar jam operasional', async () => {
      vi.spyOn(service, 'isOperationalHours').mockReturnValue(false);

      // Warga membangunkan bot dengan #menu
      await service.handleIncomingMessage(testJid, '#menu');

      // Warga memilih angka 1 untuk melihat menu informasi
      const infoReply = await service.handleIncomingMessage(testJid, '1');
      expect(infoReply).toBe(CHATBOT_MENUS.MENU_INFORMASI);

      // Warga memilih 1 lagi untuk melihat persyaratan
      const reqReply = await service.handleIncomingMessage(testJid, '1');
      expect(Array.isArray(reqReply)).toBe(true);
      expect((reqReply as string[])[0]).toContain('Persyaratan pemasukan hewan');
    });

    it('mengabaikan salam lanjutan (misal "halo") saat berada di sesi menu di luar jam operasional', async () => {
      vi.spyOn(service, 'isOperationalHours').mockReturnValue(false);

      await service.handleIncomingMessage(testJid, '#menu');
      const greetingReply = await service.handleIncomingMessage(testJid, 'halo');
      expect(greetingReply).toBeNull();
    });
  });

  describe('Format Nomor Telepon Indonesia (+62)', () => {
    it('toPlus62 harus memformat nomor awalan 0, 62, atau digit polos menjadi +62...', () => {
      expect(service.toPlus62('08123456789')).toBe('+628123456789');
      expect(service.toPlus62('628123456789')).toBe('+628123456789');
      expect(service.toPlus62('8123456789')).toBe('+628123456789');
    });

    it('formatPhoneNumber harus mengambil nomor WhatsApp dari JID dalam format +62', () => {
      expect(service.formatPhoneNumber('628123456789@s.whatsapp.net')).toBe('+628123456789');
      expect(service.formatPhoneNumber('628123456789:1@s.whatsapp.net')).toBe('+628123456789');
      expect(service.formatPhoneNumber('123456789@lid', '628123456789@s.whatsapp.net')).toBe('+628123456789');
    });

    it('normalizePhone harus menggunakan nomor WhatsApp jika pengguna tidak mengisi nomor telepon', () => {
      const detected = '+628123456789';
      expect(service.normalizePhone('', detected)).toBe('+628123456789');
      expect(service.normalizePhone('-', detected)).toBe('+628123456789');
      expect(service.normalizePhone('   ', detected)).toBe('+628123456789');
      expect(service.normalizePhone('Tidak ada', detected)).toBe('+628123456789');
      expect(service.normalizePhone('')).not.toContain('Tidak disertakan');
      expect(service.normalizePhone('')).not.toContain('tidak disertai');
      expect(service.normalizePhone('')).toBe('+62 (WhatsApp)');
    });

    it('normalizePhone harus memformat input pengguna ke +62 jika nomor valid diisi', () => {
      expect(service.normalizePhone('0821-9988-7766', '+628123456789')).toBe('+6282199887766');
      expect(service.normalizePhone('+62 821 9988 7766', '+628123456789')).toBe('+6282199887766');
      expect(service.normalizePhone('6285211223344', '+628123456789')).toBe('+6285211223344');
    });
  });
});
