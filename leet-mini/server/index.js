require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT,
  department TEXT,
  year_of_study TEXT,
  college TEXT,
  interested_lang TEXT,
  profile_pic_url TEXT,
  bio TEXT,
  class_group TEXT,
  department_group TEXT,
  college_group TEXT,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  title TEXT,
  slug TEXT,
  url TEXT,
  source TEXT,
  topic TEXT,
  difficulty TEXT
);
CREATE TABLE IF NOT EXISTS practice_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  problem_id TEXT,
  started_at INTEGER,
  ended_at INTEGER,
  language TEXT,
  code TEXT,
  outcome TEXT
);
`);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const id = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO users (id,email,password_hash,created_at,college_group) VALUES (?,?,?,?,?)')
    .run(id, email, password_hash, new Date().toISOString(), '');
  const token = issueToken({ id, email });
  res.cookie('token', token, { httpOnly: false });
  res.json({ token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = issueToken(user);
  res.cookie('token', token, { httpOnly: false });
  res.json({ token });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id,email,name,department,year_of_study,college,interested_lang,profile_pic_url,bio FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

app.put('/api/profile', authMiddleware, (req, res) => {
  const { name, department, year_of_study, college, interested_lang, profile_pic_url, bio } = req.body;
  db.prepare(`UPDATE users SET name=?, department=?, year_of_study=?, college=?, interested_lang=?, profile_pic_url=?, bio=? WHERE id=?`)
    .run(name || '', department || '', year_of_study || '', college || '', interested_lang || '', profile_pic_url || '', bio || '', req.userId);
  res.json({ ok: true });
});

const DEFAULT_COLLECTIONS = [
  { key: 'neetcode-150', source: 'NeetCode 150' },
  { key: 'blind-75', source: 'Blind 75' },
  { key: 'neetcode-250', source: 'NeetCode 250' },
  { key: 'neetcode-all', source: 'NeetCode All' },
];

async function fetchCollections() {
  // Try to load from local seed first
  const localPath = path.join(__dirname, 'seed.json');
  if (fs.existsSync(localPath)) {
    try {
      return JSON.parse(fs.readFileSync(localPath, 'utf8'));
    } catch (_) {}
  }
  // Remote placeholders (optional): add your own maintained JSON URLs here
  try {
    const url = process.env.SEED_URL;
    if (url) {
      const { data } = await axios.get(url, { timeout: 10000 });
      return data;
    }
  } catch (_) {}
  return { problems: [] };
}

async function seedProblemsIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM problems').get().c;
  if (count > 0) return;
  const data = await fetchCollections();
  const insert = db.prepare('INSERT OR IGNORE INTO problems (id,title,slug,url,source,topic,difficulty) VALUES (?,?,?,?,?,?,?)');
  const tx = db.transaction((arr) => {
    for (const p of arr) {
      insert.run(p.id, p.title, p.slug, p.url, p.source, p.topic, p.difficulty);
    }
  });
  tx(data.problems || []);
}

app.get('/api/problems', async (req, res) => {
  const { q = '', source, topic, difficulty } = req.query;
  const clauses = [];
  const params = [];
  if (source) { clauses.push('source = ?'); params.push(source); }
  if (topic) { clauses.push('topic = ?'); params.push(topic); }
  if (difficulty) { clauses.push('difficulty = ?'); params.push(difficulty); }
  if (q) { clauses.push('title LIKE ?'); params.push(`%${q}%`); }
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const rows = db.prepare(`SELECT * FROM problems ${where} ORDER BY topic, difficulty, title`).all(...params);
  res.json(rows);
});

app.get('/api/topics', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT topic FROM problems ORDER BY topic').all();
  res.json(rows.map(r => r.topic).filter(Boolean));
});

app.get('/api/sources', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT source FROM problems ORDER BY source').all();
  res.json(rows.map(r => r.source).filter(Boolean));
});

app.post('/api/practice/start', authMiddleware, (req, res) => {
  const { problem_id, language } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO practice_sessions (id,user_id,problem_id,started_at,language,code,outcome) VALUES (?,?,?,?,?,?,?)')
    .run(id, req.userId, problem_id || '', Date.now(), language || 'javascript', '', 'in-progress');
  res.json({ id });
});
app.post('/api/practice/save', authMiddleware, (req, res) => {
  const { session_id, code } = req.body;
  db.prepare('UPDATE practice_sessions SET code = ? WHERE id = ? AND user_id = ?')
    .run(code, session_id, req.userId);
  res.json({ ok: true });
});
app.post('/api/practice/finish', authMiddleware, (req, res) => {
  const { session_id, outcome } = req.body;
  db.prepare('UPDATE practice_sessions SET ended_at = ?, outcome = ? WHERE id = ? AND user_id = ?')
    .run(Date.now(), outcome || 'completed', session_id, req.userId);
  res.json({ ok: true });
});

app.get('/api/stats/summary', authMiddleware, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      SUM(CASE WHEN outcome = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN outcome != 'completed' THEN 1 ELSE 0 END) as inprogress
    FROM practice_sessions WHERE user_id = ?
  `).get(req.userId) || { completed: 0, inprogress: 0 };

  const byDifficulty = db.prepare(`
    SELECT p.difficulty as difficulty, COUNT(*) as count
    FROM practice_sessions s JOIN problems p ON p.id = s.problem_id
    WHERE s.user_id = ? AND s.outcome = 'completed'
    GROUP BY p.difficulty
  `).all(req.userId);

  const days = db.prepare(`
    SELECT DATE(datetime(started_at/1000, 'unixepoch')) as day
    FROM practice_sessions
    WHERE user_id = ?
    GROUP BY day
    ORDER BY day DESC
  `).all(req.userId).map(r => r.day);

  let streak = 0;
  if (days.length) {
    const today = new Date();
    let cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const set = new Set(days);
    while (true) {
      const key = cursor.toISOString().slice(0,10);
      if (set.has(key)) {
        streak++;
        cursor = new Date(cursor.getTime() - 86400000);
      } else break;
    }
  }

  res.json({ ...stats, byDifficulty, streak });
});

app.get('/api/leaderboard', authMiddleware, (req, res) => {
  const group = req.query.scope || 'college';
  const groupField = group === 'department' ? 'department' : group === 'class' ? 'year_of_study' : 'college';
  const rows = db.prepare(`
    SELECT u.id, coalesce(u.name, u.email) as name, u.${groupField} as group_value,
           SUM(CASE WHEN s.outcome = 'completed' THEN 1 ELSE 0 END) as solved,
           COUNT(s.id) as sessions
    FROM users u LEFT JOIN practice_sessions s ON s.user_id = u.id
    GROUP BY u.id
    ORDER BY solved DESC, sessions DESC
    LIMIT 50
  `).all();
  res.json(rows);
});

const port = process.env.PORT || 4000;
seedProblemsIfEmpty().then(() => {
  app.listen(port, () => console.log('API on ' + port));
});