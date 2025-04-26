export interface SessionData {
  isAuthenticated: boolean;
  userId?: string;
  verifiedChatIds: string[];
}
