import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ChatSessionState, UserSession } from './chatbot.types.js';

@Injectable()
export class ChatbotSessionStore implements OnModuleInit {
  private readonly logger = new Logger(ChatbotSessionStore.name);
  private readonly sessions = new Map<string, UserSession>();
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly filePath = path.join(this.dataDir, 'chatbot_sessions.json');
  private saveTimeout?: NodeJS.Timeout;

  onModuleInit() {
    this.loadFromDisk();
  }

  getSession(jid: string): UserSession {
    const cleanJid = this.normalizeJid(jid);
    let session = this.sessions.get(cleanJid);
    if (!session) {
      session = {
        jid: cleanJid,
        state: ChatSessionState.IDLE,
        lastUserMessageAt: 0,
        lastBotReplyAt: 0,
        invalidAttempts: 0,
      };
      this.sessions.set(cleanJid, session);
    }
    return session;
  }

  saveSession(session: UserSession): void {
    const cleanJid = this.normalizeJid(session.jid);
    this.sessions.set(cleanJid, session);
    this.scheduleSave();
  }

  /**
   * Dipanggil saat admin membalas secara manual dari HP / WA Web / Desktop.
   */
  recordAdminReply(jid: string): void {
    const cleanJid = this.normalizeJid(jid);
    const session = this.getSession(cleanJid);
    session.adminLastRepliedAt = Date.now();
    session.state = ChatSessionState.MUTED_BY_ADMIN;
    session.invalidAttempts = 0;
    this.saveSession(session);
    this.logger.log(`[Admin Interlock] Admin replied to ${cleanJid}. Bot will be muted during cooldown.`);
  }

  /**
   * Mengecek apakah jeda waktu (spare waktu beberapa jam) masih aktif.
   */
  isAdminCooldownActive(jid: string, cooldownHours: number): boolean {
    const cleanJid = this.normalizeJid(jid);
    const session = this.sessions.get(cleanJid);
    if (!session || !session.adminLastRepliedAt) {
      return false;
    }

    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const elapsed = Date.now() - session.adminLastRepliedAt;
    const isActive = elapsed < cooldownMs;

    if (!isActive && session.state === ChatSessionState.MUTED_BY_ADMIN) {
      // Cooldown sudah terlewati, ubah status kembali ke IDLE
      session.state = ChatSessionState.IDLE;
      session.adminLastRepliedAt = undefined;
      this.saveSession(session);
      this.logger.log(`[Admin Interlock] Cooldown expired for ${cleanJid}. Bot is now reactivated.`);
    }

    return isActive;
  }

  getRemainingCooldownMs(jid: string, cooldownHours: number): number {
    const cleanJid = this.normalizeJid(jid);
    const session = this.sessions.get(cleanJid);
    if (!session?.adminLastRepliedAt) return 0;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    const elapsed = Date.now() - session.adminLastRepliedAt;
    return Math.max(0, cooldownMs - elapsed);
  }

  resetAdminCooldown(jid: string): void {
    const cleanJid = this.normalizeJid(jid);
    const session = this.getSession(cleanJid);
    session.adminLastRepliedAt = undefined;
    session.state = ChatSessionState.IDLE;
    session.invalidAttempts = 0;
    this.saveSession(session);
    this.logger.log(`[Admin Interlock] Cooldown manually reset for ${cleanJid}`);
  }

  private normalizeJid(jid: string): string {
    return jid.trim().toLowerCase();
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.flushToDisk();
    }, 1000);
  }

  private flushToDisk(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const data: Record<string, UserSession> = {};
      for (const [key, value] of this.sessions.entries()) {
        data[key] = value;
      }
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error(`Failed to persist sessions to disk: ${(err as Error).message}`);
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw) as Record<string, UserSession>;
        for (const [key, session] of Object.entries(parsed)) {
          this.sessions.set(key, session);
        }
        this.logger.log(`Loaded ${this.sessions.size} persistent sessions from disk.`);
      }
    } catch (err) {
      this.logger.warn(`Could not load sessions from disk: ${(err as Error).message}`);
    }
  }
}
