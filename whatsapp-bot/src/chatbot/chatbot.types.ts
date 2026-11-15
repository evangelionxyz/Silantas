export enum ChatSessionState {
  IDLE = 'IDLE',
  MAIN_MENU = 'MAIN_MENU',
  MENU_INFORMASI = 'MENU_INFORMASI',
  SUBMENU_INFORMASI_PERSYARATAN = 'SUBMENU_INFORMASI_PERSYARATAN',
  SUBMENU_INFORMASI_ISIKHNAS = 'SUBMENU_INFORMASI_ISIKHNAS',
  AWAITING_INSPECTION_TEMPLATE = 'AWAITING_INSPECTION_TEMPLATE',
  AWAITING_BANTUAN_MESSAGE = 'AWAITING_BANTUAN_MESSAGE',
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
