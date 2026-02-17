import { SessionUser } from './users';

export interface SessionData {
  verifiedChatIds?: string[];
  user?: SessionUser;
}
