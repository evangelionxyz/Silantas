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
    createComplaintRecap: vi.fn().mockImplementation(async (_data) => ({
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(sessionStore).toBeDefined();
    expect(databaseService).toBeDefined();
  });

  describe('Menu Navigasi & Opsi Layanan (4 Menu)', () => {
    it('harus membalas dengan Menu Utama pada pesan pembuka dan menyertakan URL env', async () => {
      const reply = await service.handleIncomingMessage(testJid, 'Halo', 'Budi');
      expect(reply).toBeDefined();
      expect(reply).toContain('LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK');
      expect(reply).toContain('SUANGGI CARI KO');
      expect(reply).toContain('Persyaratan Pemasukan Hewan & Produk Masuk');
      expect(reply).toContain('Lapor Keluhan / Aduan Masyarakat & Penyakit Ternak');
      expect(reply).toContain('https://silantas.vercel.app');
    });

    it('harus membuka Submenu 1 (Pemasukan) saat memilih angka 1', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      const reply = await service.handleIncomingMessage(testJid, '1');

      expect(reply).toBe(CHATBOT_MENUS.SUBMENU_1_PEMASUKAN);
      expect(reply).toContain('Sertifikat Veteriner (SV)');
      expect(reply).toContain('PMK untuk ruminansia');
    });

    it('harus membuka Submenu 2 (Pengeluaran & SKKH) saat memilih angka 2', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      const reply = await service.handleIncomingMessage(testJid, '2');

      expect(reply).toBe(CHATBOT_MENUS.SUBMENU_2_PENGELUARAN);
      expect(reply).toContain('pemeriksaan klinis langsung');
      expect(reply).toContain('Masa berlaku SKKH');
    });

    it('harus membuka Submenu 3 (Rantai Dingin & NKV) saat memilih angka 3', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      const reply = await service.handleIncomingMessage(testJid, '3');

      expect(reply).toBe(CHATBOT_MENUS.SUBMENU_3_RANTAI_DINGIN);
      expect(reply).toContain('-18°C');
      expect(reply).toContain('Pelabuhan Pomako');
    });

    it('harus memandu 3 langkah formulir keluhan (nama eksplisit, nomor kontak kustom, dan isi keluhan)', async () => {
      // 1. Masuk menu
      await service.handleIncomingMessage(testJid, 'Halo', '.');

      // 2. Pilih menu 4 (Langkah 1: Nama)
      const step1Reply = await service.handleIncomingMessage(testJid, '4');
      expect(step1Reply).toBe(CHATBOT_MENUS.COMPLAINT_STEP_1_NAME);
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.COMPLAINT_AWAITING_NAME);

      // Coba masukkan nama titik (.) -> ditolak
      const invalidNameReply = await service.handleIncomingMessage(testJid, '.');
      expect(invalidNameReply).toBe(CHATBOT_MENUS.COMPLAINT_INVALID_NAME);

      // Masukkan nama lengkap yang valid -> lanjut Langkah 2
      const step2Reply = await service.handleIncomingMessage(testJid, 'Yohanes Maturbongs');
      expect(step2Reply).toContain('Halo Bapak/Ibu *Yohanes Maturbongs*');
      expect(step2Reply).toContain('Langkah 2 dari 3');
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.COMPLAINT_AWAITING_PHONE);

      // 3. Masukkan nomor kontak kustom (penanggung jawab kandang di lokasi) -> lanjut Langkah 3
      const customPhone = '082199887766';
      const step3Reply = await service.handleIncomingMessage(testJid, customPhone);
      expect(step3Reply).toContain(`Nomor kontak tersimpan: *${customPhone}*`);
      expect(step3Reply).toContain('Langkah 3 dari 3');
      expect(sessionStore.getSession(testJid).state).toBe(ChatSessionState.COMPLAINT_AWAITING_DESCRIPTION);

      // 4. Masukkan isi keluhan
      const complaintText = 'Lapor ada 3 ekor sapi demam dan air liur berlebih di Distrik Kuala Kencana';
      const confirmReply = await service.handleIncomingMessage(testJid, complaintText);

      // Verifikasi database service menerima nama dan nomor kontak kustom yang tepat
      expect(mockDatabaseService.createComplaintRecap).toHaveBeenCalledWith({
        reporterName: 'Yohanes Maturbongs',
        reporterPhone: '082199887766',
        address: 'Kabupaten Mimika',
        description: complaintText,
      });

      // Verifikasi bukti tiket aduan
      expect(confirmReply).toContain('BUKTI PENCATATAN ADUAN MASYARAKAT');
      expect(confirmReply).toContain('ADU-TEST1234');
      expect(confirmReply).toContain('Yohanes Maturbongs');
      expect(confirmReply).toContain('082199887766');

      // State beralih ke WAITING_FOR_ADMIN dan admin cooldown aktif
      const sessionAfter = sessionStore.getSession(testJid);
      expect(sessionAfter.state).toBe(ChatSessionState.WAITING_FOR_ADMIN);
      expect(sessionAfter.adminLastRepliedAt).toBeDefined();

      // Pesan lanjutan dari warga diabaikan agar admin menindaklanjuti
      const followUp = await service.handleIncomingMessage(testJid, 'Mohon segera dibalas ya');
      expect(followUp).toBeNull();
    });

    it('bisa memilih menggunakan nomor terdeteksi dengan mengetik OK pada langkah 2', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      await service.handleIncomingMessage(testJid, '4');
      await service.handleIncomingMessage(testJid, 'Maria Omaleng');

      // Ketik OK untuk memakai nomor default WA
      const step3Reply = await service.handleIncomingMessage(testJid, 'OK');
      expect(step3Reply).toContain('08123456789');

      await service.handleIncomingMessage(testJid, 'Babi sakit di SP6');
      expect(mockDatabaseService.createComplaintRecap).toHaveBeenCalledWith(
        expect.objectContaining({
          reporterName: 'Maria Omaleng',
          reporterPhone: '08123456789',
        }),
      );
    });

    it('harus kembali ke Menu Utama saat mengetik 0 dari submenu', async () => {
      await service.handleIncomingMessage(testJid, '1');
      const reply = await service.handleIncomingMessage(testJid, '0');

      expect(reply).toContain('LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK');
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
      expect(reply).toContain('LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK');
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

    it('harus memunculkan kembali menu jika warga mengetik command #menu atau menu saat masih dalam cooldown admin', async () => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const session = sessionStore.getSession(testJid);
      session.adminLastRepliedAt = tenMinutesAgo;
      session.state = ChatSessionState.MUTED_BY_ADMIN;
      sessionStore.saveSession(session);

      const reply = await service.handleIncomingMessage(testJid, '#menu');
      expect(reply).not.toBeNull();
      expect(reply).toContain('LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK');

      const updatedSession = sessionStore.getSession(testJid);
      expect(updatedSession.state).toBe(ChatSessionState.MAIN_MENU);
      expect(updatedSession.adminLastRepliedAt).toBeUndefined();

      const sub1 = await service.handleIncomingMessage(testJid, '1');
      expect(sub1).toBe(CHATBOT_MENUS.SUBMENU_1_PEMASUKAN);
    });

    it('harus memunculkan kembali menu jika warga mengetik 0 saat masih dalam cooldown admin', async () => {
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const session = sessionStore.getSession(testJid);
      session.adminLastRepliedAt = tenMinutesAgo;
      session.state = ChatSessionState.MUTED_BY_ADMIN;
      sessionStore.saveSession(session);

      const reply = await service.handleIncomingMessage(testJid, '0');
      expect(reply).not.toBeNull();
      expect(reply).toContain('LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK');
    });
  });

  describe('Proteksi Anti-Spam & Input Tidak Valid', () => {
    it('memberikan petunjuk ramah saat input tidak valid < 3 kali', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      const invalid1 = await service.handleIncomingMessage(testJid, 'xyz123');

      expect(invalid1).toBe(CHATBOT_MENUS.INVALID_OPTION_HINT);
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
});
