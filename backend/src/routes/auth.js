import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-2026-bibliotheca';

// Registration Route
router.post('/signup', async (req, res) => {
  const { name, email, password, avatarColor } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required fields.' });
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email address is already registered.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        avatarColor: avatarColor || '#8b5cf6',
        status: 'active',
        role: 'user'
      }
    });

    // Create system log
    await prisma.systemLog.create({
      data: {
        type: 'system',
        message: `New user registered: ${name} (${email})`
      }
    });

    return res.status(201).json({ 
      message: 'Account registered successfully!',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    console.error('Signup Error:', err);
    return res.status(500).json({ error: 'Server database error during registration.' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required fields.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User profile not found.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended by the administrator.' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials. Password verification failed.' });
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      message: 'Authentication successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarColor: user.avatarColor,
        role: user.role,
        goal: user.goal,
        goalProgress: user.goalProgress,
        fines: user.fines
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Server error during login authentication.' });
  }
});

export default router;
