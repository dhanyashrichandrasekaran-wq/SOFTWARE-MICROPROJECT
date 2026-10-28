import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from '../db';
import { hashPassword, verifyPassword, createToken, requireAuth, AuthenticatedRequest } from '../services/auth';

const router = Router();

// Register (Students Only)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailTrimmed);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr-${crypto.randomUUID()}`;

    // Security rule: Students can never register themselves as administrators
    const role = 'student';

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(userId, emailTrimmed, name.trim(), passwordHash, role);

    const authUser = { id: userId, email: emailTrimmed, name: name.trim(), role: role as 'student' };
    const token = createToken(authUser);

    res.cookie('scamquest_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: authUser,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const emailTrimmed = email.trim().toLowerCase();
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailTrimmed) as any;

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'student' | 'admin',
    };
    const token = createToken(authUser);

    res.cookie('scamquest_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful.',
      token,
      user: authUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Get Current User Profile
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  res.json({ user: req.user });
});

// Logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('scamquest_token');
  res.json({ message: 'Logged out successfully.' });
});

export default router;
