import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/roomManager';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types';

/**
 * Gère les événements utilisateur: join, leave
 */
export function handleUserEvents(
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  roomManager: RoomManager,
  userId: string,
  username: string,
  typingUsers: Map<string, Set<string>>
): void {
  /**
   * Événement: user:join
   * L'utilisateur rejoint une room
   */
  socket.on('user:join', (data) => {
    const { roomId } = data;

    console.log(`📌 ${username} is joining room ${roomId}`);

    // Ajouter l'utilisateur à la room dans RoomManager
    roomManager.addUserToRoom(roomId, userId, username);

    // Rejoindre le canal Socket.IO de la room
    socket.join(roomId);

    // Récupérer les utilisateurs de la room
    const roomUsers = roomManager.getRoomUsers(roomId);
    const totalUsers = roomManager.getRoomUserCount(roomId);

    // Notifier les utilisateurs de la room qu'un nouvel utilisateur a rejoint
    io.to(roomId).emit('user:joined', {
      roomId,
      user: {
        userId,
        username,
      },
      users: roomUsers,
      totalUsers,
    });

    console.log(`✅ ${username} joined room ${roomId}. Total users: ${totalUsers}`);
  });

  /**
   * Événement: user:leave
   * L'utilisateur quitte une room
   */
  socket.on('user:leave', (data) => {
    const { roomId } = data;

    console.log(`📌 ${username} is leaving room ${roomId}`);

    // Retirer l'utilisateur de la room
    roomManager.removeUserFromRoom(roomId, userId);

    // Quitter le canal Socket.IO de la room
    socket.leave(roomId);

    // Nettoyer le typing pour cette room
    if (typingUsers.has(roomId)) {
      typingUsers.get(roomId)!.delete(username);

      if (typingUsers.get(roomId)!.size === 0) {
        typingUsers.delete(roomId);
      } else {
        const typingList = Array.from(typingUsers.get(roomId)!);
        io.to(roomId).emit('user:typing-updated', {
          roomId,
          typingUsers: typingList,
        });
      }
    }

    // Récupérer les utilisateurs restants de la room
    const roomUsers = roomManager.getRoomUsers(roomId);

    // Notifier les utilisateurs restants qu'un utilisateur a quitté
    io.to(roomId).emit('user:left', {
      roomId,
      user: {
        userId,
        username,
      },
      users: roomUsers,
    });

    console.log(`✅ ${username} left room ${roomId}`);
  });
}
