import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { ChatbotService } from '../chatbot/chatbot.service.js';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private sock?: WASocket;
  private stopped = false;

  /**
   * Menyimpan ID pesan yang dikirim oleh bot sendiri.
   * Digunakan untuk membedakan antara pesan otomatis bot vs pesan yang diketik oleh admin manusia.
   */
  private readonly botSentMessageIds = new Set<string>();

  /**
   * Buffer debounce untuk pesan beruntun dari pengguna (misal: "halo", "pak", "mau tanya").
   */
  private readonly debounceTimers = new Map<string, NodeJS.Timeout>();
  private readonly messageBuffers = new Map<string, { texts: string[]; pushName?: string }>();
  private readonly debounceMs = 1500;

  constructor(private readonly chatbotService: ChatbotService) {}

  async onModuleInit() {
    await this.connect();
  }

  onModuleDestroy() {
    this.stopped = true;
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.messageBuffers.clear();
    void this.sock?.end(undefined);
  }

  private async connect() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({ version, auth: state });
    this.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) qrcode.generate(qr, { small: true });
      if (connection === 'open') this.logger.log('WhatsApp connected successfully.');
      if (connection === 'close') {
        const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
        if (code !== DisconnectReason.loggedOut && !this.stopped) {
          void this.connect();
        } else {
          this.logger.warn('Logged out. Delete auth_info/ and restart to re-scan QR.');
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        const jid = msg.key.remoteJid;
        // 1. Filter chat grup, broadcast status, dan newsletter
        if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.endsWith('@newsletter')) {
          continue;
        }

        // 2. Deteksi pesan keluar (fromMe === true)
        if (msg.key.fromMe) {
          const msgId = msg.key.id;
          if (msgId && this.botSentMessageIds.has(msgId)) {
            // Pesan ini dikirim oleh mesin bot -> hapus dari tracker dan abaikan
            this.botSentMessageIds.delete(msgId);
            continue;
          }

          // Pesan keluar BUKAN dari mesin bot -> ADMIN MANUSIA SEDANG MEMBALAS!
          this.logger.log(`[Admin Interlock] Admin membalas langsung ke ${jid}. Mengaktifkan jeda bot.`);
          this.chatbotService.handleAdminReply(jid);

          // Batalkan timer buffer bot yang mungkin sedang menunggu untuk jid ini
          if (this.debounceTimers.has(jid)) {
            clearTimeout(this.debounceTimers.get(jid));
            this.debounceTimers.delete(jid);
            this.messageBuffers.delete(jid);
          }
          continue;
        }

        // 3. Pesan masuk dari masyarakat
        const text =
          msg.message?.conversation ??
          msg.message?.extendedTextMessage?.text ??
          msg.message?.imageMessage?.caption ??
          msg.message?.videoMessage?.caption;

        if (!text) continue;

        const pushName = msg.pushName || undefined;
        this.enqueueIncomingMessage(jid, text, pushName);
      }
    });
  }

  /**
   * Menerapkan debouncing pesan beruntun dari pengguna agar tidak spam menu.
   */
  private enqueueIncomingMessage(jid: string, text: string, pushName?: string) {
    const existing = this.messageBuffers.get(jid) || { texts: [], pushName };
    existing.texts.push(text);
    if (pushName) existing.pushName = pushName;
    this.messageBuffers.set(jid, existing);

    if (this.debounceTimers.has(jid)) {
      clearTimeout(this.debounceTimers.get(jid));
    }

    this.debounceTimers.set(
      jid,
      setTimeout(() => {
        this.debounceTimers.delete(jid);
        const buffered = this.messageBuffers.get(jid);
        this.messageBuffers.delete(jid);

        if (buffered && buffered.texts.length > 0) {
          // Ambil input terakhir yang dikirim pengguna dalam buffer
          const latestText = buffered.texts[buffered.texts.length - 1];
          void this.processMessage(jid, latestText, buffered.pushName);
        }
      }, this.debounceMs),
    );
  }

  private async processMessage(jid: string, text: string, pushName?: string) {
    try {
      const reply = await this.chatbotService.handleIncomingMessage(jid, text, pushName);
      if (!reply || !this.sock) return;

      const replies = Array.isArray(reply) ? reply : [reply];
      for (const replyText of replies) {
        if (!replyText) continue;
        const sent = await this.sock.sendMessage(jid, { text: replyText });
        if (sent?.key?.id) {
          this.recordBotSentId(sent.key.id);
        }
        if (replies.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }
    } catch (err) {
      this.logger.error(`Error processing message from ${jid}: ${(err as Error).message}`);
    }
  }

  private recordBotSentId(id: string): void {
    this.botSentMessageIds.add(id);
    // Batasi ukuran set tracker agar memori tetap ringan
    if (this.botSentMessageIds.size > 2000) {
      const first = this.botSentMessageIds.values().next().value;
      if (first) this.botSentMessageIds.delete(first);
    }
  }
}
