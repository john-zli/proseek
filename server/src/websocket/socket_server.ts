import { sessionMiddleware } from '@server/middleware/session';
import { getPrayerRequestChat } from '@server/models/prayer_request_chats_storage';
import { logger } from '@server/services/logger';
import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server | null = null;

interface SetupSocketServerOptions {
  sessionMiddlewareOverride?: (...args: unknown[]) => void;
}

export function setupSocketServer(httpServer: HttpServer, options?: SetupSocketServerOptions): Server {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // Share Express session middleware with Socket.IO
  io.engine.use(options?.sessionMiddlewareOverride ?? sessionMiddleware);

  io.on('connection', socket => {
    const session = (
      socket.request as { session?: { user?: { userId: string; churchIds: string[] }; verifiedChatIds?: string[] } }
    ).session;

    socket.on('join_room', async ({ requestId }: { requestId: string }) => {
      try {
        if (!requestId) {
          socket.emit('join_error', { message: 'requestId is required' });
          return;
        }

        // Church member auth: validate churchIds includes the prayer request's assignedChurchId
        if (session?.user) {
          const prayerRequest = await getPrayerRequestChat(requestId);
          if (!prayerRequest?.assignedChurchId || !session.user.churchIds.includes(prayerRequest.assignedChurchId)) {
            socket.emit('join_error', { message: 'You do not have access to this prayer request' });
            return;
          }
        } else if (session?.verifiedChatIds) {
          // Seeker auth: validate verifiedChatIds includes requestId
          if (!session.verifiedChatIds.includes(requestId)) {
            socket.emit('join_error', { message: 'Chat not verified' });
            return;
          }
        } else {
          socket.emit('join_error', { message: 'Not authenticated' });
          return;
        }

        await socket.join(requestId);
        socket.emit('joined', { requestId });
      } catch (error) {
        logger.error(error, 'Error joining room');
        socket.emit('join_error', { message: 'Failed to join room' });
      }
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
