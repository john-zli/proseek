import { SanitizedUser } from './users';

export interface SessionData {
  isAuthenticated: boolean;
  verifiedChatIds?: string[];
  user?: SanitizedUser;
}
