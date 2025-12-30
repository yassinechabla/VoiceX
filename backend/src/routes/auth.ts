import { Router, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { authRateLimiter } from '../middleware/security';

const router = Router();

/**
 * POST /auth/register
 * Register a new admin user (dev only, should be protected in production)
 */
router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = new User({ username, role: 'ADMIN' });
    await (user as any).setPassword(password);
    await user.save();
    
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error: any) {
    if (error.name === 'UserExistsError') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

/**
 * POST /auth/login
 * Login and get JWT token
 */
router.post('/login', authRateLimiter, (req: Request, res: Response, next: any) => {
  passport.authenticate('local', { session: false }, (err: Error, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication error', details: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', details: info?.message });
    }
    
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '2h';
    
    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      secret,
      { expiresIn }
    );
    
    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
      },
    });
  })(req, res, next);
});

/**
 * GET /auth/me
 * Get current user info (protected)
 */
router.get('/me', authenticateJWT, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;

