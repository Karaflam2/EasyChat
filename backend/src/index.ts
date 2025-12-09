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

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    // Compter les enregistrements dans chaque table
    const [users, rooms, messages, members] = await Promise.all([
      User.count(),
      Room.count(),
      Message.count(),
      RoomMember.count()
    ]);
    
    res.json({
      status: 'OK',
      database: 'connected',
      tables: {
        users,
        rooms,
        messages,
        room_members: members
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize database and start server
const startServer = async () => {
  let retries = 5;
  
  while (retries > 0) {
    try {
      console.log('🔄 Tentative de connexion à la base de données...');
      
      // Test database connection
      await sequelize.authenticate();
      console.log('✅ Connexion à la base de données établie');

      // Sync models (alter: true pour mettre à jour sans supprimer les données)
      await sequelize.sync({ alter: true });
      console.log('✅ Modèles synchronisés avec la base de données');

      // Vérifier les tables
      const tables = await sequelize.getQueryInterface().showAllTables();
      console.log('📊 Tables disponibles:', tables);

      // Create default rooms if they don't exist
      console.log('🏗️  Création des rooms par défaut...');
      
      const defaultRooms = [
        { name: 'general', description: '💬 General discussion' },
        { name: 'random', description: '🎲 Random topics' },
        { name: 'announcements', description: '📢 Important news' },
        { name: 'fun', description: '🎉 Have fun!' },
      ];

      // Créer ou récupérer l'utilisateur système
      const [systemUser] = await User.findOrCreate({
        where: { email: 'system@chatbox.local' },
        defaults: {
          username: 'system',
          email: 'system@chatbox.local',
          password: 'system_password_123',
          status: 'online',
        },
      });

      console.log('✅ Utilisateur système créé/récupéré');

      // Créer les rooms par défaut
      for (const roomData of defaultRooms) {
        const [room, created] = await Room.findOrCreate({
          where: { name: roomData.name },
          defaults: {
            ...roomData,
            createdById: systemUser.id,
          },
        });
        
        if (created) {
          console.log(`   ✓ Room créée: ${roomData.name}`);
        }
      }

      console.log('✅ Rooms par défaut initialisées');

      // Statistiques
      const stats = {
        users: await User.count(),
        rooms: await Room.count(),
        messages: await Message.count(),
        members: await RoomMember.count(),
      };

      console.log('📊 Statistiques de la base de données:');
      console.log(`   • Utilisateurs: ${stats.users}`);
      console.log(`   • Rooms: ${stats.rooms}`);
      console.log(`   • Messages: ${stats.messages}`);
      console.log(`   • Membres: ${stats.members}`);

      // Start server
      app.listen(PORT, () => {
        console.log('');
        console.log('🚀 ========================================');
        console.log(`🚀 Backend server running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
        console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        console.log(`💾 DB Health: http://localhost:${PORT}/health/db`);
        console.log('🚀 ========================================');
        console.log('');
      });
      
      break; // Succès, sortir de la boucle
      
    } catch (error) {
      retries--;
      console.error(`❌ Échec de la connexion. Tentatives restantes: ${retries}`);
      
      if (retries > 0) {
        console.log('⏳ Nouvelle tentative dans 5 secondes...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('❌ Impossible de se connecter à la base de données après plusieurs tentatives');
        console.error('Détails de l\'erreur:', error);
        process.exit(1);
      }
    }
  }
};

startServer();