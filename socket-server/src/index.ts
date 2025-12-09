import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { RoomManager } from './rooms/roomManager';
import { handleUserEvents } from './events/userEvents';
import { handleMessageEvents } from './events/messageEvents';
import { handleTypingEvents } from './events/typingEvents';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.SOCKET_PORT || 3002;
const roomManager = new RoomManager();

// Stockage temporaire des utilisateurs connectés
const connectedUsers = new Map<string, { userId: string; username: string; socketId: string }>();

// Stockage des utilisateurs en train de taper par room
const typingUsers = new Map<string, Set<string>>();

/**
 * Gestion des connexions Socket.IO
 */
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;
  const username = socket.handshake.query.username as string;

  console.log(`✅ User connected: ${username} (${socket.id})`);

  // Enregistrer l'utilisateur
  connectedUsers.set(socket.id, { userId, username, socketId: socket.id });

  // Confirmer la connexion
  socket.emit('connection:success', {
    socketId: socket.id,
    message: 'Connected to Socket.IO server',
  });

  // ============================================
  // Gérer les événements utilisateur
  // ============================================
  handleUserEvents(io, socket, roomManager, userId, username);

  // ============================================
  // Gérer les événements de messages
  // ============================================
  handleMessageEvents(io, socket, userId, username);

  // ============================================
  // Gérer les événements de typing
  // ============================================
  const { cleanupTyping } = handleTypingEvents(io, socket, username, typingUsers);

  // ============================================
  // Cleanup lors de la déconnexion
  // ============================================
  socket.on('disconnect', () => {
    try {
      console.log(`❌ User disconnected: ${username} (${socket.id})`);

      // Récupérer tous les salons de l'utilisateur
      const userRooms = roomManager.getUserRooms(userId);

      // Nettoyer le typing
      cleanupTyping(userRooms);

      // Retirer des utilisateurs connectés
      connectedUsers.delete(socket.id);

      console.log(`✅ Full cleanup completed for ${username}`);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

/**
 * Routes Express
 */

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    connectedUsers: connectedUsers.size,
    activeRooms: roomManager.getActiveRoomsCount(),
    timestamp: new Date().toISOString(),
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const stats = roomManager.getStats();
  res.json({
    ...stats,
    connectedSockets: connectedUsers.size,
    typingRooms: typingUsers.size,
  });
});

/**
 * Démarrer le serveur
 */
httpServer.listen(PORT, () => {
  console.log('');
  console.log('🔌 ========================================');
  console.log(`🔌 Socket.IO server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Stats: http://localhost:${PORT}/stats`);
  console.log('🔌 ========================================');
  console.log('');
});