import { Router } from 'express';
import { db } from '../db.ts';

export const authRouter = Router();

// Demo role switch or login
authRouter.post('/login', (req, res) => {
  const { email, role, userId } = req.body;
  const state = db.getState();

  let user = null;
  if (userId) {
    user = state.users.find((u) => u.id === userId);
  } else if (email) {
    user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  } else if (role) {
    user = state.users.find((u) => u.role === role);
  }

  if (!user) {
    return res.status(401).json({ error: 'User account not found' });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      linkedStudentIds: user.linkedStudentIds,
    },
    token: `demo-token-${user.id}`,
  });
});

authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const state = db.getState();

  // If token provided
  if (authHeader && authHeader.startsWith('Bearer demo-token-')) {
    const userId = authHeader.replace('Bearer demo-token-', '');
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      return res.json({ user });
    }
  }

  // Default to admin user for quick initial load
  const defaultAdmin = state.users.find((u) => u.role === 'admin') || state.users[0];
  res.json({ user: defaultAdmin });
});

authRouter.get('/users', (req, res) => {
  const state = db.getState();
  const safeUsers = state.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    linkedStudentIds: u.linkedStudentIds,
  }));
  res.json({ users: safeUsers });
});
