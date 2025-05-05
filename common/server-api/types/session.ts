export interface SessionData {
  isAuthenticated: boolean;
  verifiedChatIds?: string[];
  user?: { id: string; email: string; churchId: string };
}
