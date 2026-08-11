/**
 * Production Node.js & Express Server for Aleena AI.
 * 
 * Features:
 * - Express HTTP REST API
 * - WebSocket Server for Real-Time Streaming & Avatar Emotion Control
 * - Render PostgreSQL Database Integration
 * - Gemini AI Integration (Backend only)
 * - JWT Authentication & Bcrypt Password Security
 * - Production-grade Helmet, Rate Limiting, CORS, and Health Check Endpoint
 */

const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Environment Variables & Constants ─────────────────────────────────────
const PORT = process.env.PORT || 8765;
const NODE_ENV = process.env.NODE_ENV || 'production';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const JWT_SECRET = process.env.JWT_SECRET || 'aleena-ai-super-secret-jwt-key-change-in-production';
const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─── Database Pool Configuration ──────────────────────────────────────────
let pool = null;
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  console.log('[DATABASE] PostgreSQL Pool initialized with DATABASE_URL.');
} else {
  console.log('[DATABASE] Note: DATABASE_URL not supplied. In-memory fallback mode active.');
}

// In-Memory Fallback Store (for local dev / testing without DB)
const inMemoryStore = {
  sessions: [{ session_id: 'default-session', title: 'General Conversation', created_at: new Date() }],
  messages: {},
  users: [],
};

// ─── Gemini AI Client Setup ────────────────────────────────────────────────
let geminiModel = null;
if (GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('[AI] Gemini 1.5 Flash initialized successfully.');
} else {
  console.log('[AI] Warning: GEMINI_API_KEY not set. Operating with baseline conversational engine.');
}

const SYSTEM_PROMPT = `You are Aleena, an intelligent, empathetic, and multi-capable AI companion and digital human assistant.
You speak warmly, concisely, and helpfully. Respond in the exact language the user uses.

If user asks for code, format with clean markdown codeblocks.
Keep responses engaging, natural, and helpful.`;

// ─── Express App Setup ─────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Security Headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS Policy
app.use(cors({
  origin: FRONTEND_URL === '*' ? true : FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiter for Auth & Chat Endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/', apiLimiter);

// ─── Helper Functions ──────────────────────────────────────────────────────
function detectEmotion(text) {
  if (!text) return 'neutral';
  const lower = text.toLowerCase();
  if (/happy|great|wonderful|love|awesome|yay|smile|😊|😄/.test(lower)) return 'happy';
  if (/excited|amazing|incredible|wow|brilliant|fantastic/.test(lower)) return 'excited';
  if (/sad|sorry|bad|regret|unfortunate|😢|heartbroken/.test(lower)) return 'sad';
  if (/oh|really\?|no way|whoa|surprised|😮/.test(lower)) return 'surprised';
  if (/think|curious|wonder|interesting|hmm|🤔/.test(lower)) return 'curious';
  return 'neutral';
}

async function saveMessage(sessionId, role, content, emotion = 'neutral') {
  if (pool) {
    try {
      await pool.query(
        'INSERT INTO chat_messages (session_id, role, content, emotion) VALUES ($1, $2, $3, $4)',
        [sessionId, role, content, emotion]
      );
      return;
    } catch (err) {
      console.error('[DATABASE] Save message error:', err.message);
    }
  }

  if (!inMemoryStore.messages[sessionId]) {
    inMemoryStore.messages[sessionId] = [];
  }
  inMemoryStore.messages[sessionId].push({
    id: String(Date.now()),
    role,
    content,
    emotion,
    timestamp: new Date().toISOString(),
  });
}

async function getHistory(sessionId, limit = 100) {
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT id, session_id, role, content, emotion, timestamp FROM chat_messages WHERE session_id = $1 ORDER BY id ASC LIMIT $2',
        [sessionId, limit]
      );
      return res.rows;
    } catch (err) {
      console.error('[DATABASE] Get history error:', err.message);
    }
  }

  return inMemoryStore.messages[sessionId] || [];
}

async function listSessions(userId = null) {
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT session_id, title, created_at FROM chat_sessions ORDER BY created_at DESC'
      );
      return res.rows;
    } catch (err) {
      console.error('[DATABASE] List sessions error:', err.message);
    }
  }

  return inMemoryStore.sessions;
}

async function createSession(title = null, userId = null) {
  const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  const sessionTitle = title || `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  if (pool) {
    try {
      await pool.query(
        'INSERT INTO chat_sessions (session_id, user_id, title) VALUES ($1, $2, $3)',
        [sessionId, userId, sessionTitle]
      );
      return { session_id: sessionId, title: sessionTitle, created_at: new Date().toISOString() };
    } catch (err) {
      console.error('[DATABASE] Create session error:', err.message);
    }
  }

  const sessionObj = { session_id: sessionId, title: sessionTitle, created_at: new Date().toISOString() };
  inMemoryStore.sessions.unshift(sessionObj);
  return sessionObj;
}

// ─── REST Endpoints ────────────────────────────────────────────────────────

// Health Check Endpoint (Phase 7 Requirement)
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  if (pool) {
    try {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
    }
  }

  res.json({
    status: 'ok',
    service: 'Aleena AI',
    environment: NODE_ENV,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Authentication Endpoints (Phases 12 & 13)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (pool) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      const result = await pool.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email.toLowerCase(), passwordHash, name || 'User']
      );
      const user = result.rows[0];
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ status: 'ok', user, token });
    }

    // In-memory fallback
    const userObj = { id: inMemoryStore.users.length + 1, email: email.toLowerCase(), name: name || 'User' };
    inMemoryStore.users.push({ ...userObj, passwordHash });
    const token = jwt.sign({ userId: userObj.id, email: userObj.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ status: 'ok', user: userObj, token });
  } catch (err) {
    console.error('[AUTH] Registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    let user = null;
    let passwordHash = null;

    if (pool) {
      const result = await pool.query('SELECT id, email, password_hash, name FROM users WHERE email = $1', [email.toLowerCase()]);
      if (result.rows.length > 0) {
        user = { id: result.rows[0].id, email: result.rows[0].email, name: result.rows[0].name };
        passwordHash = result.rows[0].password_hash;
      }
    } else {
      const found = inMemoryStore.users.find(u => u.email === email.toLowerCase());
      if (found) {
        user = { id: found.id, email: found.email, name: found.name };
        passwordHash = found.passwordHash;
      }
    }

    if (!user || !passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ status: 'ok', user, token });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// REST Chat & Generator Endpoints
app.post('/api/chat', async (req, res) => {
  const { message, session_id } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const activeSessionId = session_id || 'default-session';
  await saveMessage(activeSessionId, 'user', message);

  let replyText = '';
  if (geminiModel) {
    try {
      const historyRows = await getHistory(activeSessionId, 20);
      const contents = historyRows.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      }));

      const chatSession = geminiModel.startChat({
        history: contents.slice(0, -1),
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await chatSession.sendMessage(message);
      replyText = result.response.text();
    } catch (err) {
      console.error('[AI] Gemini error:', err.message);
      replyText = "Hello! I am Aleena. I received your message: '" + message + "'. How can I help you today?";
    }
  } else {
    replyText = "Hello! I am Aleena AI. I received your message: '" + message + "'. Ask me anything!";
  }

  const emotion = detectEmotion(replyText);
  await saveMessage(activeSessionId, 'assistant', replyText, emotion);

  return res.json({
    status: 'ok',
    response: replyText,
    session_id: activeSessionId,
    emotion,
  });
});

app.get('/api/settings', (req, res) => {
  res.json({
    voice_rate: 150,
    voice_volume: 1.0,
    stt_language: 'en-IN',
    model: 'gemini-1.5-flash',
  });
});

// Serve frontend static assets if dist / web output exists
const staticPath = path.join(__dirname, 'web', 'out');
app.use(express.static(staticPath));

// ─── WebSocket Server (Phase 17 Requirement) ──────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WEBSOCKET] Client connected.');

  ws.on('message', async (raw) => {
    try {
      const payload = JSON.parse(raw.toString());
      const type = payload.type;
      const data = payload.data || {};

      if (type === 'chat.send') {
        const text = (data.text || '').trim();
        const sessionId = data.session_id || 'default-session';

        if (!text) return;

        await saveMessage(sessionId, 'user', text);
        ws.send(JSON.stringify({ type: 'status.update', data: { status: 'thinking' } }));

        let fullReply = '';
        if (geminiModel) {
          try {
            const historyRows = await getHistory(sessionId, 20);
            const contents = historyRows.map(h => ({
              role: h.role === 'user' ? 'user' : 'model',
              parts: [{ text: h.content }],
            }));

            const chatSession = geminiModel.startChat({
              history: contents.slice(0, -1),
              systemInstruction: SYSTEM_PROMPT,
            });

            const result = await chatSession.sendMessage(text);
            fullReply = result.response.text();
          } catch (err) {
            console.error('[AI] Stream Gemini error:', err.message);
            fullReply = `I understand your message: '${text}'. How else can I assist you?`;
          }
        } else {
          fullReply = `I am Aleena AI. Processing your request: '${text}'`;
        }

        const emotion = detectEmotion(fullReply);

        // Stream tokens simulation
        const words = fullReply.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + ' ';
          ws.send(JSON.stringify({ type: 'chat.stream', data: { token: chunk } }));
          await new Promise(r => setTimeout(r, 25));
        }

        await saveMessage(sessionId, 'assistant', fullReply, emotion);

        ws.send(JSON.stringify({
          type: 'chat.done',
          data: { full_response: fullReply, emotion, session_id: sessionId }
        }));
        ws.send(JSON.stringify({ type: 'status.update', data: { status: 'ready' } }));

      } else if (type === 'session.list') {
        const sessions = await listSessions();
        ws.send(JSON.stringify({
          type: 'session.list',
          data: { sessions, active_session_id: sessions[0]?.session_id || 'default-session' }
        }));
      } else if (type === 'session.create') {
        const newSess = await createSession(data.title);
        ws.send(JSON.stringify({ type: 'session.created', data: newSess }));
      } else if (type === 'history.get') {
        const sid = data.session_id || 'default-session';
        const msgs = await getHistory(sid);
        ws.send(JSON.stringify({ type: 'history.data', data: { session_id: sid, messages: msgs } }));
      }
    } catch (err) {
      console.error('[WEBSOCKET] Message processing error:', err);
    }
  });

  ws.on('close', () => {
    console.log('[WEBSOCKET] Client disconnected.');
  });
});

// Production SPA Fallback Route (Phase 26 Requirement)
app.get('*', (req, res) => {
  const indexHtml = path.join(staticPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).json({ status: 'ok', message: 'Aleena AI API Server running.' });
    }
  });
});

// ─── Server Start ──────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Aleena AI server listening on 0.0.0.0:${PORT} (Environment: ${NODE_ENV})`);
});
