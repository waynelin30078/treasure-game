// Authentication helpers: password hashing (bcryptjs) and JWT sign/verify.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret for signing JWTs. Override via env in real deployments.
const JWT_SECRET = process.env.JWT_SECRET || 'treasure-game-dev-secret-change-me';
const TOKEN_TTL = '7d';

// Hashes a plaintext password. Input: password (string). Output: Promise<hash string>.
function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Verifies a password against a hash. Input: password (string), hash (string).
// Output: Promise<boolean>.
function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Signs a JWT for a user. Input: user { id, username }. Output: token string.
function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Verifies a JWT. Input: token (string). Output: decoded payload, or null if invalid.
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Express middleware that requires a valid Bearer token and attaches req.user.
// Input/Output: standard Express (req, res, next).
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = payload;
  next();
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, authMiddleware };
