/**
 * Types pour le serveur Socket.IO
 */

export interface User {
  userId: string;
  username: string;
  socketId: string;
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
}

export interface RoomUser {
  userId: string;
  username: string;
  joinedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  users: User[];
}

// Events envoyés par le client
export interface ClientToServerEvents {
  'user:join': (data: { roomId: string }) => void;
  'user:leave': (data: { roomId: string }) => void;
  'message:send': (data: { roomId: string; content: string }) => void;
  'user:typing-start': (data: { roomId: string }) => void;
  'user:typing-stop': (data: { roomId: string }) => void;
}

// Events envoyés par le serveur
export interface ServerToClientEvents {
  'connection:success': (data: { socketId: string; message: string }) => void;
  'message:new': (data: Message) => void;
  'user:joined': (data: {
    roomId: string;
    user: { userId: string; username: string };
    users: RoomUser[];
    totalUsers: number;
  }) => void;
  'user:left': (data: {
    roomId: string;
    user: { userId: string; username: string };
    users: RoomUser[];
  }) => void;
  'user:typing-updated': (data: { roomId: string; typingUsers: string[] }) => void;
  'user:status-changed': (data: {
    roomId: string;
    userId: string;
    status: 'online' | 'offline' | 'away';
  }) => void;
  error: (data: { message: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  username: string;
}