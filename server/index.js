// Express API server for the treasure game: signup, login, profile, and high-score.
const express = require('express');
const { createUser, findByUsername, findById, updateHighScore } = require('./db');
const { hashPassword, verifyPassword, signToken, authMiddleware } = require('./auth');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Basic username/password validation. Input: username, password. Output: error string or null.
function validateCredentials(username, password) {
  if (typeof username !== 'string' || username.trim().length < 3) {
    return 'Username must be at least 3 characters';
  }
  if (typeof password !== 'string' || password.length < 4) {
    return 'Password must be at least 4 characters';
  }
  return null;
}

// POST /api/signup -> create a user and return a JWT.
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body || {};
  const error = validateCredentials(username, password);
  if (error) return res.status(400).json({ error });

  if (findByUsername(username.trim())) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const passwordHash = await hashPassword(password);
  const user = createUser(username.trim(), passwordHash);
  const token = signToken(user);
  res.json({ token, username: user.username, highScore: user.high_score });
});

// POST /api/login -> verify credentials and return a JWT.
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const user = findByUsername(username.trim());
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = signToken(user);
  res.json({ token, username: user.username, highScore: user.high_score });
});

// GET /api/me -> current user's profile (requires auth).
app.get('/api/me', authMiddleware, (req, res) => {
  const user = findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ username: user.username, highScore: user.high_score });
});

// POST /api/score -> record a finished game's score, keeping only the highest (requires auth).
app.post('/api/score', authMiddleware, (req, res) => {
  const { score } = req.body || {};
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return res.status(400).json({ error: 'Score must be a number' });
  }
  const highScore = updateHighScore(req.user.id, score);
  res.json({ highScore });
});

app.listen(PORT, () => {
  console.log(`Treasure game API listening on http://localhost:${PORT}`);
});
