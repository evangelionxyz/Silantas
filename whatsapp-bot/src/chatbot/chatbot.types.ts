export enum ChatSessionState {
  IDLE = 'IDLE',
  MAIN_MENU = 'MAIN_MENU',
  SUBMENU_PEMASUKAN = 'SUBMENU_PEMASUKAN',
  SUBMENU_PENGELUARAN = 'SUBMENU_PENGELUARAN',
  SUBMENU_RANTAI_DINGIN = 'SUBMENU_RANTAI_DINGIN',
  AWAITING_COMPLAINT_TEMPLATE = 'AWAITING_COMPLAINT_TEMPLATE',
  COMPLAINT_AWAITING_NAME = 'COMPLAINT_AWAITING_NAME',
  COMPLAINT_AWAITING_PHONE = 'COMPLAINT_AWAITING_PHONE',
  COMPLAINT_AWAITING_DESCRIPTION = 'COMPLAINT_AWAITING_DESCRIPTION',
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
  adminCooldownHours: number;
  debounceMs: number;
  maxMessagesInWindow: number;
  rateLimitWindowMs: number;
}
