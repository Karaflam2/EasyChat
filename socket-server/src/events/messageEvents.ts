import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, Message } from '../types';

/**
 * Gère les événements de messages: send
 */
export function handleMessageEvents(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  userId: string,
  username: string
): void {
  /**
   * Événement: message:send
   * L'utilisateur envoie un message
   */
  socket.on('message:send', (data) => {
    const { roomId, content } = data;

    console.log(`💬 ${username} sent message in room ${roomId}: "${content}"`);

    // Valider le contenu
    if (!content || content.trim().length === 0) {
      socket.emit('error', {
        message: 'Message cannot be empty',
      });
      return;
    }

    // Créer le message
    const message: Message = {
      id: generateMessageId(),
      roomId,
      userId,
      username,
      content,
      createdAt: new Date(),
    };

    // Émettre le message à tous les utilisateurs de la room
    io.to(roomId).emit('message:new', message);

    console.log(`✅ Message sent to room ${roomId}`);
  });
}

/**
 * Génère un ID unique pour un message
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
