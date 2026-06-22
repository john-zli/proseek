import type { ChatMessagePayload, ReadReceiptPayload } from '@common/server-api/types/prayer_request_chats';
import { useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseChatSocketParams {
  chatroomId: string | undefined;
  isVerified: boolean;
  onMessage: (payload: ChatMessagePayload) => void;
  onReadReceipt: (payload: ReadReceiptPayload) => void;
}

export function useChatSocket({ chatroomId, isVerified, onMessage, onReadReceipt }: UseChatSocketParams) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const onReadReceiptRef = useRef(onReadReceipt);
  onReadReceiptRef.current = onReadReceipt;

  const socketRef = useRef<Socket | null>(null);

  const emitMarkRead = useCallback(
    (lastReadMessageId: string) => {
      if (socketRef.current && chatroomId) {
        socketRef.current.emit('mark_read', { requestId: chatroomId, lastReadMessageId });
      }
    },
    [chatroomId]
  );

  useEffect(() => {
    if (!chatroomId || !isVerified) return;

    const socket: Socket = io({
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { requestId: chatroomId });
    });

    socket.on('new_message', (payload: ChatMessagePayload) => {
      onMessageRef.current(payload);
    });

    socket.on('read_receipt', (payload: ReadReceiptPayload) => {
      onReadReceiptRef.current(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatroomId, isVerified]);

  return { emitMarkRead };
}
