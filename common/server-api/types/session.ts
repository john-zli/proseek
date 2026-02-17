import { SanitizedUser } from './users';

export interface SessionData {
  verifiedChatIds?: string[];
  user?: SanitizedUser;
}
