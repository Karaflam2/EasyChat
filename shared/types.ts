export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
}

export interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  createdAt: Date;
  reactions?: { emoji: string; count: number }[];
  editedAt?: Date;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: User[];
  createdAt: Date;
}

export interface SocketEvents {
  // Client -> Server
  'message:send': (data: { roomId: string; content: string }) => void;
  'user:join': (data: { roomId: string }) => void;
  'user:typing': (data: { roomId: string; isTyping: boolean }) => void;

  // Server -> Client
  'message:new': (data: Message) => void;
  'user:status-changed': (data: User) => void;
  'room:users-updated': (data: User[]) => void;
}