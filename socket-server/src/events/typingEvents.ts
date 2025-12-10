import { Server, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';

/**
 * Gère les événements de typing: start, stop
 */
export function handleTypingEvents(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  username: string,
  typingUsers: Map<string, Set<string>>
): {
  cleanupTyping: (userRooms: string[]) => void;
} {
  /**
   * Événement: user:typing-start
   * L'utilisateur commence à taper
   */
  socket.on('user:typing-start', (data) => {
    const { roomId } = data;

    console.log(`⌨️  ${username} is typing in room ${roomId}`);

    // Initialiser le Set pour la room si nécessaire
    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Set());
    }

    // Ajouter l'utilisateur à la liste des utilisateurs en train de taper
    typingUsers.get(roomId)!.add(username);

    // Émettre la liste des utilisateurs en train de taper
    const typingUsersList = Array.from(typingUsers.get(roomId)!);
    io.to(roomId).emit('user:typing-updated', {
      roomId,
      typingUsers: typingUsersList,
    });

    console.log(`✅ Typing started: ${typingUsersList.join(', ')}`);
  });

  /**
   * Événement: user:typing-stop
   * L'utilisateur arrête de taper
   */
  socket.on('user:typing-stop', (data) => {
    const { roomId } = data;

    console.log(`⌨️  ${username} stopped typing in room ${roomId}`);

    // Retirer l'utilisateur de la liste des utilisateurs en train de taper
    if (typingUsers.has(roomId)) {
      typingUsers.get(roomId)!.delete(username);

      // Si la room est vide, la supprimer
      if (typingUsers.get(roomId)!.size === 0) {
        typingUsers.delete(roomId);
      }
    }

    // Émettre la liste mise à jour
    const typingUsersList = typingUsers.has(roomId) ? Array.from(typingUsers.get(roomId)!) : [];
    io.to(roomId).emit('user:typing-updated', {
      roomId,
      typingUsers: typingUsersList,
    });

    console.log(`✅ Typing stopped`);
  });

  /**
   * Fonction de cleanup: à appeler lors de la déconnexion de l'utilisateur
   * Retire l'utilisateur de toutes les rooms où il était en train de taper
   */
  const cleanupTyping = (userRooms: string[]): void => {
    userRooms.forEach((roomId) => {
      if (typingUsers.has(roomId)) {
        typingUsers.get(roomId)!.delete(username);

        // Si la room est vide, la supprimer
        if (typingUsers.get(roomId)!.size === 0) {
          typingUsers.delete(roomId);
        } else {
          // Émettre la liste mise à jour
          const typingUsersList = Array.from(typingUsers.get(roomId)!);
          io.to(roomId).emit('user:typing-updated', {
            roomId,
            typingUsers: typingUsersList,
          });
        }
      }
    });
  };

  return { cleanupTyping };
}
