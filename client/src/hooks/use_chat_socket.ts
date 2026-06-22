import type { ChatMessagePayload } from '@common/server-api/types/prayer_request_chats';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseChatSocketParams {
  chatroomId: string | undefined;
  isVerified: boolean;
  onMessage: (payload: ChatMessagePayload) => void;
}

export function useChatSocket({ chatroomId, isVerified, onMessage }: UseChatSocketParams) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!chatroomId || !isVerified) return;

    const socket: Socket = io({
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('join_room', { requestId: chatroomId });
    });

    socket.on('new_message', (payload: ChatMessagePayload) => {
      onMessageRef.current(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [chatroomId, isVerified]);
}
