import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  email: string;
  status: 'online' | 'offline' | 'away';
}

interface Message {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
}

interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdById: string;
}

interface ChatStore {
  currentUser: User | null;
  token: string | null;
  rooms: Room[];
  messages: { [roomId: string]: Message[] };
  roomUsers: { [roomId: string]: User[] };
  typingUsers: { [roomId: string]: string[] };
  currentRoomId: string | null;

  // User actions
  setCurrentUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;

  // Room actions
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  setCurrentRoom: (roomId: string) => void;

  // Message actions
  addMessage: (roomId: string, message: Message) => void;
  setMessages: (roomId: string, messages: Message[]) => void;
  addMessageToRoom: (roomId: string, message: Message) => void;

  // User list actions
  setRoomUsers: (roomId: string, users: User[]) => void;
  addUserToRoom: (roomId: string, user: User) => void;
  removeUserFromRoom: (roomId: string, userId: string) => void;

  // Typing actions
  setTypingUsers: (roomId: string, users: string[]) => void;
  addTypingUser: (roomId: string, username: string) => void;
  removeTypingUser: (roomId: string, username: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentUser: null,
  token: null,
  rooms: [],
  messages: {},
  roomUsers: {},
  typingUsers: {},
  currentRoomId: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setToken: (token) => set({ token }),
  logout: () => set({ currentUser: null, token: null, currentRoomId: null }),

  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),

  addMessage: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    })),
  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: messages,
      },
    })),
  addMessageToRoom: (roomId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] || []), message],
      },
    })),

  setRoomUsers: (roomId, users) =>
    set((state) => ({
      roomUsers: {
        ...state.roomUsers,
        [roomId]: users,
      },
    })),
  addUserToRoom: (roomId, user) =>
    set((state) => ({
      roomUsers: {
        ...state.roomUsers,
        [roomId]: [...(state.roomUsers[roomId] || []), user],
      },
    })),
  removeUserFromRoom: (roomId, userId) =>
    set((state) => ({
      roomUsers: {
        ...state.roomUsers,
        [roomId]: (state.roomUsers[roomId] || []).filter((u) => u.id !== userId),
      },
    })),

  setTypingUsers: (roomId, users) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [roomId]: users,
      },
    })),
  addTypingUser: (roomId, username) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [roomId]: [...new Set([...(state.typingUsers[roomId] || []), username])],
      },
    })),
  removeTypingUser: (roomId, username) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [roomId]: (state.typingUsers[roomId] || []).filter((u) => u !== username),
      },
    })),
}));