import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import { User, Room, Message, RoomMember } from './models';

import authRoutes from './routes/auth';
import roomsRoutes from './routes/rooms';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync models
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');

    // Create default rooms if they don't exist
    const defaultRooms = [
      { name: 'general', description: '💬 General discussion' },
      { name: 'random', description: '🎲 Random topics' },
      { name: 'announcements', description: '📢 Important news' },
      { name: 'fun', description: '🎉 Have fun!' },
    ];

    const systemUser = await User.findOrCreate({
      where: { email: 'system@chatbox.local' },
      defaults: {
        username: 'system',
        email: 'system@chatbox.local',
        password: 'system_password_123',
        status: 'online',
      },
    });

    for (const roomData of defaultRooms) {
      await Room.findOrCreate({
        where: { name: roomData.name },
        defaults: {
          ...roomData,
          createdById: systemUser[0].id,
        },
      });
    }

    console.log('✅ Default rooms initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();