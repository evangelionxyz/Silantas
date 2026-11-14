export enum ChatSessionState {
  IDLE = 'IDLE',
  MAIN_MENU = 'MAIN_MENU',
  SUBMENU_PEMASUKAN = 'SUBMENU_PEMASUKAN',
  SUBMENU_PENGELUARAN = 'SUBMENU_PENGELUARAN',
  SUBMENU_RANTAI_DINGIN = 'SUBMENU_RANTAI_DINGIN',
  AWAITING_TRACKING_NO = 'AWAITING_TRACKING_NO',
  WAITING_FOR_ADMIN = 'WAITING_FOR_ADMIN',
  MUTED_BY_ADMIN = 'MUTED_BY_ADMIN',
}

export interface UserSession {
  jid: string;
  name?: string;
  state: ChatSessionState;
  lastUserMessageAt: number;
  lastBotReplyAt: number;
  adminLastRepliedAt?: number;
  invalidAttempts: number;
  metadata?: Record<string, unknown>;
}

export interface BotConfig {
  /**
   * Durasi hening setelah admin membalas manual (dalam jam).
   * Default: 4 jam.
   */
  adminCooldownHours: number;
  /**
   * Jeda buffer debouncing pesan bertubi-tubi (dalam ms).
   * Default: 1500 ms.
   */
  debounceMs: number;
  /**
   * Batas maksimal pesan dalam jangka waktu rate limit.
   */
  maxMessagesInWindow: number;
  /**
   * Jendela waktu rate limit (dalam ms).
   */
  rateLimitWindowMs: number;
}
