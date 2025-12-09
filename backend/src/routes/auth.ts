import { Router, Response } from 'express';
import { User } from '../models';
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUsername = await User.findOne({
      where: { username },
    });

    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      status: 'offline',
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update status
    await user.update({ status: 'online' });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.toJSON());
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findByPk(req.userId);

    if (user) {
      await user.update({ status: 'offline' });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;