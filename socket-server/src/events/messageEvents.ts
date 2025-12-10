import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, Message } from '../types';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Gère les événements de messages: send
 */
export function handleMessageEvents(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  userId: string,
  username: string,
  authToken?: string
): void {
  /**
   * Événement: message:send
   * L'utilisateur envoie un message
   */
  socket.on('message:send', async (data) => {
    const { roomId, content } = data;

    console.log(`💬 ${username} sent message in room ${roomId}: "${content}"`);

    // Valider le contenu
    if (!content || content.trim().length === 0) {
      socket.emit('error', {
        message: 'Message cannot be empty',
      });
      return;
    }

    if (!authToken) {
      socket.emit('error', { message: 'Missing authentication token' });
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        const message = errorPayload.error || 'Unable to save message';
        socket.emit('error', { message });
        return;
      }

      const saved = (await response.json()) as Message & { username?: string };

      const message: Message = {
        id: saved.id,
        roomId: saved.roomId,
        userId: saved.userId,
        username: saved.username || username,
        content: saved.content,
        createdAt: saved.createdAt ? new Date(saved.createdAt) : new Date(),
      };

      io.to(roomId).emit('message:new', message);

      console.log(`✅ Message saved & sent to room ${roomId}`);
    } catch (error) {
      console.error('Error saving message', error);
      socket.emit('error', { message: 'Server error while saving message' });
    }
  });
}

/**
 * Génère un ID unique pour un message
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
