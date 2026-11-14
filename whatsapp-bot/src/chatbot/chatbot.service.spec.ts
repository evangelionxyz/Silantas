import { Test, TestingModule } from '@nestjs/testing';
import { CHATBOT_MENUS } from './chatbot-menus.js';
import { ChatbotSessionStore } from './chatbot-session.store.js';
import { ChatbotService } from './chatbot.service.js';
import { ChatSessionState } from './chatbot.types.js';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let sessionStore: ChatbotSessionStore;
  const testJid = '628123456789@s.whatsapp.net';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatbotService, ChatbotSessionStore],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    sessionStore = module.get<ChatbotSessionStore>(ChatbotSessionStore);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(sessionStore).toBeDefined();
  });

  describe('Menu Navigasi & Opsi Layanan', () => {
    it('harus membalas dengan Menu Utama pada pesan pembuka', async () => {
      const reply = await service.handleIncomingMessage(testJid, 'Halo', 'Budi');
      expect(reply).toBeDefined();
      expect(reply).toContain('LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK');
      expect(reply).toContain('SUANGGI CARI KO');
      expect(reply).toContain('Persyaratan Pemasukan Hewan & Produk Masuk');
      expect(reply).toContain('Pengeluaran Hewan & Penerbitan SKKH');
    });

    it('harus merespons pesan template resmi dari frontend WhatsAppConsultation', async () => {
      const templateMsg =
        'Halo Dokter Hewan SUANGGI Mimika, saya ingin mengajukan jadwal pemeriksaan kesehatan ternak untuk penerbitan SKKH Pengeluaran (keluar daerah).';
      const reply = await service.handleIncomingMessage(testJid, templateMsg, 'Yohanes');
      expect(reply).toBeDefined();
      expect(reply).toContain('LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK');
      expect(reply).toContain('Yohanes');
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

    it('harus meminta nomor permohonan saat memilih angka 4', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      const reply = await service.handleIncomingMessage(testJid, '4');

      expect(reply).toBe(CHATBOT_MENUS.SUBMENU_4_CEK_STATUS);
      expect(reply).toContain('CEK STATUS PERMOHONAN REKOMENDASI');
    });

    it('harus mencatat dan mengalihkan ke petugas saat memilih angka 5', async () => {
      await service.handleIncomingMessage(testJid, 'Halo');
      const reply = await service.handleIncomingMessage(testJid, '5');

      expect(reply).toBe(CHATBOT_MENUS.SUBMENU_5_HUBUNGI_PETUGAS);
      expect(reply).toContain('Dokter Hewan Dinas Peternakan');

      const session = sessionStore.getSession(testJid);
      expect(session.state).toBe(ChatSessionState.WAITING_FOR_ADMIN);

      // Setelah memilih 5, pesan rincian berikutnya tidak diinterupsi oleh menu bot
      const followUp = await service.handleIncomingMessage(testJid, 'Pak sapi saya demam 3 hari');
      expect(followUp).toBeNull();
    });

    it('harus kembali ke Menu Utama saat mengetik 0 dari submenu', async () => {
      await service.handleIncomingMessage(testJid, '1');
      const reply = await service.handleIncomingMessage(testJid, '0');

      expect(reply).toContain('LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK');
    });
  });

  describe('Admin Interlock & Cooldown (Spare Waktu 4 Jam)', () => {
    it('harus diam (return null) setelah admin membalas manual', async () => {
      // 1. Warga menyapa bot
      const reply1 = await service.handleIncomingMessage(testJid, 'Halo admin');
      expect(reply1).not.toBeNull();

      // 2. Admin membalas langsung dari HP / WA Web
      service.handleAdminReply(testJid);

      // 3. Warga membalas lagi dalam kurun waktu cooldown (misal 5 menit kemudian)
      const replyAfterAdmin = await service.handleIncomingMessage(testJid, 'Terima kasih banyak pak admin');

      // Bot HARUS diam dan tidak mengirim menu apapun!
      expect(replyAfterAdmin).toBeNull();
    });

    it('harus aktif kembali setelah spare waktu 4 jam telah lewat', async () => {
      // Set admin reply timestamp 4.5 jam yang lalu
      const fourAndHalfHoursAgo = Date.now() - 4.5 * 60 * 60 * 1000;
      const session = sessionStore.getSession(testJid);
      session.adminLastRepliedAt = fourAndHalfHoursAgo;
      session.state = ChatSessionState.MUTED_BY_ADMIN;
      sessionStore.saveSession(session);

      // Warga mengirim pesan baru setelah 4 jam
      const reply = await service.handleIncomingMessage(testJid, 'Halo, saya mau tanya lagi');

      // Bot harus merespons kembali dengan Menu Utama
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
      // Admin baru saja membalas 10 menit yang lalu (cooldown masih aktif)
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const session = sessionStore.getSession(testJid);
      session.adminLastRepliedAt = tenMinutesAgo;
      session.state = ChatSessionState.MUTED_BY_ADMIN;
      sessionStore.saveSession(session);

      // Warga mengetik #menu secara eksplisit
      const reply = await service.handleIncomingMessage(testJid, '#menu');

      // Cooldown harus di-override dan bot harus menampilkan Menu Utama
      expect(reply).not.toBeNull();
      expect(reply).toContain('LAYANAN INFORMASI LALU LINTAS HEWAN & TERNAK');

      // Status sesi harus kembali ke MAIN_MENU
      const updatedSession = sessionStore.getSession(testJid);
      expect(updatedSession.state).toBe(ChatSessionState.MAIN_MENU);
      expect(updatedSession.adminLastRepliedAt).toBeUndefined();

      // Warga sekarang bisa memilih menu lain, misalnya opsi 1
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

      // Pesan berikutnya tidak dibalas bot lagi
      const nextMsg = await service.handleIncomingMessage(testJid, 'masih salah');
      expect(nextMsg).toBeNull();
    });
  });
});
