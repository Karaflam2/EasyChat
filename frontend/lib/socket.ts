import { io, Socket } from 'socket.io-client';
import { useChatStore } from '@/store/chatStore';

let socket: Socket | null = null;

export const initSocket = (userId: string, username: string, token?: string): Socket => {
  if (socket) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://172.20.10.5:3002' || 'http://localhost:3002', {
    query: {
      userId,
      username,
      token,
    },
  });

  socket.on('connection:success', (data) => {
    console.log('Socket connected:', data);
  });

  socket.on('message:new', (message) => {
    useChatStore.setState((state) => ({
      messages: {
        ...state.messages,
        [message.roomId]: [
          ...(state.messages[message.roomId] || []),
          {
            ...message,
            createdAt: new Date(message.createdAt),
          },
        ],
      },
    }));
  });

  socket.on('user:joined', (data) => {
    useChatStore.setState((state) => ({
      roomUsers: {
        ...state.roomUsers,
        [data.roomId]: data.users,
      },
    }));
  });

  socket.on('user:left', (data) => {
    useChatStore.setState((state) => ({
      roomUsers: {
        ...state.roomUsers,
        [data.roomId]: data.users,
      },
    }));
  });

  socket.on('user:typing-updated', (data) => {
    useChatStore.setState((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [data.roomId]: data.typingUsers,
      },
    }));
  });

  socket.on('user:status-changed', (data) => {
    useChatStore.setState((state) => ({
      roomUsers: {
        ...state.roomUsers,
        [data.roomId]: state.roomUsers[data.roomId]?.map((user) =>
          user.id === data.userId ? { ...user, status: data.status } : user
        ),
      },
    }));
  });

  socket.on('error', (data) => {
    console.error('Socket error:', data);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    socket = null;
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const sendMessage = (roomId: string, content: string) => {
  if (socket) {
    socket.emit('message:send', {
      roomId,
      content,
    });
  }
};

export const joinRoom = (roomId: string) => {
  if (socket) {
    socket.emit('user:join', {
      roomId,
    });
  }
};

export const leaveRoom = (roomId: string) => {
  if (socket) {
    socket.emit('user:leave', {
      roomId,
    });
  }
};

export const startTyping = (roomId: string) => {
  if (socket) {
    socket.emit('user:typing-start', {
      roomId,
    });
  }
};

export const stopTyping = (roomId: string) => {
  if (socket) {
    socket.emit('user:typing-stop', {
      roomId,
    });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};