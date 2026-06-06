// SQLite data layer for the treasure game, backed by Node's built-in node:sqlite.
// Requires running Node with the --experimental-sqlite flag (Node 22.x).
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// Single shared database handle. game.db lives at the project root.
const db = new DatabaseSync(path.join(__dirname, '..', 'game.db'));

// Create the users table on startup if it does not yet exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    high_score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`);

// Inserts a new user. Input: username (string), passwordHash (string).
// Output: the created user row { id, username, high_score }.
function createUser(username, passwordHash) {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare('INSERT INTO users (username, password_hash, high_score, created_at) VALUES (?, ?, 0, ?)')
    .run(username, passwordHash, createdAt);
  return { id: Number(result.lastInsertRowid), username, high_score: 0 };
}

// Looks up a user by username. Input: username (string).
// Output: full user row including password_hash, or undefined if not found.
function findByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

// Looks up a user by id. Input: id (number). Output: user row or undefined.
function findById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// Raises a user's high score only when the new score is greater.
// Input: id (number), score (number). Output: the resulting high score (number).
function updateHighScore(id, score) {
  const user = findById(id);
  if (!user) throw new Error('User not found');
  if (score > user.high_score) {
    db.prepare('UPDATE users SET high_score = ? WHERE id = ?').run(score, id);
    return score;
  }
  return user.high_score;
}

module.exports = { db, createUser, findByUsername, findById, updateHighScore };
