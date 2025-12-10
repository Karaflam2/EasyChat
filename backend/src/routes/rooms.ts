import { Router, Response } from 'express';
import { Room, User, Message, RoomMember } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

const router = Router();

// Get all rooms
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await Room.findAll({
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'username', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create room
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isPrivate } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Room name required' });
    }

    // Check if room exists
    const existingRoom = await Room.findOne({ where: { name } });

    if (existingRoom) {
      return res.status(409).json({ error: 'Room name already exists' });
    }

    // Create room
    const room = await Room.create({
      name: name.toLowerCase(),
      description,
      isPrivate: isPrivate || false,
      createdById: req.userId,
    });

    // Add creator as member
    await RoomMember.create({
      roomId: room.id,
      userId: req.userId,
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room by ID
router.get('/:roomId', async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findByPk(req.params.roomId, {
      include: [
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'username', 'email'],
        },
      ],
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get room messages
router.get('/:roomId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.findAll({
      where: { roomId: req.params.roomId },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'email'],
        },
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    const payload = messages.map((msg) => {
      const plain = msg.toJSON() as any;
      return {
        ...plain,
        username: plain.User?.username,
      };
    });

    res.json(payload);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create message in a room
router.post('/:roomId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const room = await Room.findByPk(req.params.roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const user = await User.findByPk(userId, { attributes: ['id', 'username', 'email'] });

    const message = await Message.create({
      roomId: req.params.roomId,
      userId,
      content: content.trim(),
    });

    res.status(201).json({
      ...message.toJSON(),
      username: user?.username,
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Get room users
router.get('/:roomId/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'status'],
      include: [
        {
          model: Room,
          as: 'memberOf',
          where: { id: req.params.roomId },
          attributes: [],
          through: { attributes: [] },
        },
      ],
    });

    res.json(users);
  } catch (error) {
    console.error('Get room users error:', error);
    res.status(500).json({ error: 'Failed to fetch room users' });
  }
});

// Join room
router.post('/:roomId/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const room = await Room.findByPk(req.params.roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if already member
    const isMember = await RoomMember.findOne({
      where: {
        roomId: req.params.roomId,
        userId: req.userId,
      },
    });

    if (isMember) {
      return res.status(409).json({ error: 'Already a member of this room' });
    }

    // Add member
    await RoomMember.create({
      roomId: req.params.roomId,
      userId: req.userId,
    });

    res.json({ message: 'Successfully joined room' });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Leave room
router.post('/:roomId/leave', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await RoomMember.destroy({
      where: {
        roomId: req.params.roomId,
        userId: req.userId,
      },
    });

    res.json({ message: 'Successfully left room' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

export default router;