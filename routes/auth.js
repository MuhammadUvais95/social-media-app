// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password, bio, avatarUrl } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash, bio: bio || '', avatarUrl: avatarUrl || '' });
    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl } });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Registration failed', details: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await User.findOne({ where: { [require('sequelize').Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }] } });
  if (!user) return res.status(400).json({ error: 'User not found' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, bio: user.bio, avatarUrl: user.avatarUrl } });
});

module.exports = router;
