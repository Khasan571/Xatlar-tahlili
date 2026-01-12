import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'xatlar-tahlili-secret-2024';
const JWT_EXPIRES_IN = '7d';
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;

// Allowed origins for CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'https://xatlar-tahlili.vercel.app',
      'https://xatlar-tahlili-khasan.vercel.app'
    ];

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const app = express();

// ============ SECURITY MIDDLEWARE ============
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}));

app.use(compression());

const logFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (NODE_ENV === 'development') return callback(null, true);
    if (origin && origin.endsWith('.vercel.app')) return callback(null, true);
    if (origin && origin.endsWith('.onrender.com')) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// ============ RATE LIMITING ============
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Juda ko'p so'rov. 15 daqiqadan keyin urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Juda ko'p urinish. 15 daqiqadan keyin urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============ INPUT VALIDATION ============
const validateString = (value, minLen = 1, maxLen = 1000) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= minLen && trimmed.length <= maxLen;
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token taqdim etilmagan' });
  }
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token yaroqsiz' });
  }
};

// ============ DATABASE INIT ============
async function ensureTables() {
  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        timestamp BIGINT NOT NULL,
        file_name TEXT,
        content_snippet TEXT,
        full_content TEXT NOT NULL,
        analysis TEXT NOT NULL,
        user_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Letter types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS letter_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL
      )
    `);

    // Hierarchy table
    await client.query(`
      CREATE TABLE IF NOT EXISTS hierarchy (
        id INTEGER PRIMARY KEY DEFAULT 1,
        data TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin if not exists
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      const adminPassword = bcrypt.hashSync('admin123', 10);
      await client.query(
        'INSERT INTO users (id, username, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5)',
        [randomUUID(), 'admin', adminPassword, 'Administrator', 'admin']
      );
      console.log('Admin yaratildi: admin / admin123');
    }

    // Seed letter types if empty
    const ltCount = await client.query('SELECT COUNT(*) as count FROM letter_types');
    if (parseInt(ltCount.rows[0].count) === 0) {
      const types = [
        { id: 'lt-1', name: "Ta'lim sifatini nazorat qilish", desc: "Dars sifati" },
        { id: 'lt-2', name: "O'quv reja va dasturlar", desc: "Rejalar" },
        { id: 'lt-3', name: "Kredit-modul tizimi", desc: "Kredit tizimi" },
        { id: 'lt-4', name: "Yakuniy nazorat", desc: "Imtihonlar" },
        { id: 'lt-5', name: "Talabalar masalalari", desc: "Talabalar" }
      ];
      for (const t of types) {
        await client.query('INSERT INTO letter_types (id, name, description) VALUES ($1, $2, $3)', [t.id, t.name, t.desc]);
      }
    }

    // Seed hierarchy if empty
    const hCount = await client.query('SELECT COUNT(*) as count FROM hierarchy');
    if (parseInt(hCount.rows[0].count) === 0) {
      await client.query('INSERT INTO hierarchy (id, data) VALUES (1, $1)', ['[]']);
    }

    console.log('PostgreSQL database tayyor!');
  } finally {
    client.release();
  }
}

// ============ AUTH ROUTES ============
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, fullName } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username va parol majburiy' });
    if (password.length < 6) return res.status(400).json({ error: 'Parol kamida 6 belgi' });

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Username mavjud' });

    const passwordHash = bcrypt.hashSync(password, 10);
    const id = randomUUID();
    await pool.query(
      'INSERT INTO users (id, username, password_hash, full_name) VALUES ($1, $2, $3, $4)',
      [id, username, passwordHash, fullName || username]
    );

    const token = jwt.sign({ id, username, fullName: fullName || username, role: 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ token, user: { id, username, fullName: fullName || username, role: 'user' } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Xatolik' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username va parol majburiy' });

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Noto'g'ri username yoki parol" });

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: "Noto'g'ri username yoki parol" });
    }

    const token = jwt.sign({ id: user.id, username: user.username, fullName: user.full_name, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, username: user.username, fullName: user.full_name, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Xatolik' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => res.json({ user: req.user }));

// Password change
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Joriy va yangi parol majburiy' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Yangi parol kamida 6 belgi bo'lishi kerak" });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: "Joriy parol noto'g'ri" });
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);

    res.json({ success: true, message: "Parol muvaffaqiyatli o'zgartirildi" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Parolni o'zgartirishda xatolik" });
  }
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', database: 'postgresql' }));

// ============ DOCUMENTS ============
app.get('/api/documents', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const totalRow = await pool.query('SELECT COUNT(*) as total FROM documents');
    const total = parseInt(totalRow.rows[0].total);

    const result = await pool.query(
      'SELECT * FROM documents ORDER BY timestamp DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const docs = result.rows.map(r => ({
      id: r.id,
      timestamp: parseInt(r.timestamp),
      fileName: r.file_name,
      contentSnippet: r.content_snippet,
      fullContent: r.full_content,
      analysis: JSON.parse(r.analysis)
    }));

    res.json({
      documents: docs,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hujjat topilmadi' });

    const r = result.rows[0];
    res.json({
      id: r.id,
      timestamp: parseInt(r.timestamp),
      fileName: r.file_name,
      contentSnippet: r.content_snippet,
      fullContent: r.full_content,
      analysis: JSON.parse(r.analysis)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/documents', authMiddleware, async (req, res) => {
  try {
    const { fileName, contentSnippet, fullContent, analysis, timestamp } = req.body;

    if (!analysis || !fullContent) {
      return res.status(400).json({ error: 'analysis va fullContent majburiy' });
    }
    if (!validateString(fullContent, 1, 100000)) {
      return res.status(400).json({ error: 'fullContent 100000 belgidan oshmasligi kerak' });
    }

    const id = req.body.id || randomUUID();
    const ts = timestamp || Date.now();
    const sanitizedContent = sanitizeString(fullContent);

    // Upsert logic
    const existing = await pool.query('SELECT id FROM documents WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE documents SET timestamp = $1, file_name = $2, content_snippet = $3, full_content = $4, analysis = $5 WHERE id = $6',
        [ts, fileName || null, contentSnippet || '', sanitizedContent, JSON.stringify(analysis), id]
      );
    } else {
      await pool.query(
        'INSERT INTO documents (id, timestamp, file_name, content_snippet, full_content, analysis, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, ts, fileName || null, contentSnippet || '', sanitizedContent, JSON.stringify(analysis), req.user.id]
      );
    }

    res.status(201).json({ id, timestamp: ts, fileName, contentSnippet, fullContent: sanitizedContent, analysis });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT id FROM documents WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Hujjat topilmadi' });

    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    res.json({ success: true, message: "Hujjat o'chirildi" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// Bulk delete
app.post('/api/documents/bulk-delete', authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "O'chirish uchun hujjat ID lari kerak" });
    }
    if (ids.length > 100) {
      return res.status(400).json({ error: "Bir vaqtda 100 tadan ortiq hujjat o'chirib bo'lmaydi" });
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(`DELETE FROM documents WHERE id IN (${placeholders})`, ids);

    res.json({
      success: true,
      deleted: result.rowCount,
      message: `${result.rowCount} ta hujjat o'chirildi`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Hujjatlarni o'chirishda xatolik" });
  }
});

// ============ SEARCH ============
app.get('/api/search', authMiddleware, async (req, res) => {
  try {
    const { q, type, urgency, dateFrom, dateTo } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    if (q && q.trim()) {
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      whereClauses.push(`(LOWER(full_content) LIKE $${paramIndex} OR LOWER(content_snippet) LIKE $${paramIndex} OR LOWER(file_name) LIKE $${paramIndex})`);
      params.push(searchTerm);
      paramIndex++;
    }

    if (dateFrom) {
      whereClauses.push(`timestamp >= $${paramIndex}`);
      params.push(parseInt(dateFrom));
      paramIndex++;
    }
    if (dateTo) {
      whereClauses.push(`timestamp <= $${paramIndex}`);
      params.push(parseInt(dateTo));
      paramIndex++;
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) as total FROM documents ${whereSQL}`, params);
    const total = parseInt(countResult.rows[0].total);

    const dataResult = await pool.query(
      `SELECT * FROM documents ${whereSQL} ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const docs = dataResult.rows.map(r => ({
      id: r.id,
      timestamp: parseInt(r.timestamp),
      fileName: r.file_name,
      contentSnippet: r.content_snippet,
      fullContent: r.full_content,
      analysis: JSON.parse(r.analysis)
    }));

    res.json({
      results: docs,
      query: { q, type, urgency, dateFrom, dateTo },
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Qidiruv xatosi' });
  }
});

// ============ STATISTICS ============
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM documents');
    const totalDocs = parseInt(totalResult.rows[0].count);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayResult = await pool.query('SELECT COUNT(*) as count FROM documents WHERE timestamp >= $1', [todayStart.getTime()]);
    const todayDocs = parseInt(todayResult.rows[0].count);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekResult = await pool.query('SELECT COUNT(*) as count FROM documents WHERE timestamp >= $1', [weekAgo]);
    const weekDocs = parseInt(weekResult.rows[0].count);

    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthResult = await pool.query('SELECT COUNT(*) as count FROM documents WHERE timestamp >= $1', [monthAgo]);
    const monthDocs = parseInt(monthResult.rows[0].count);

    const allDocsResult = await pool.query('SELECT analysis FROM documents');
    const typeMap = {};
    const urgencyMap = { High: 0, Medium: 0, Low: 0 };
    const deptMap = {};
    let totalErrors = 0;

    allDocsResult.rows.forEach(row => {
      try {
        const analysis = JSON.parse(row.analysis);
        const docType = analysis.docType || 'Aniqlanmagan';
        typeMap[docType] = (typeMap[docType] || 0) + 1;

        if (analysis.urgency && urgencyMap[analysis.urgency] !== undefined) {
          urgencyMap[analysis.urgency]++;
        }

        const dept = analysis.departmentOrigin || 'Aniqlanmagan';
        deptMap[dept] = (deptMap[dept] || 0) + 1;

        if (analysis.grammarErrors) {
          totalErrors += analysis.grammarErrors.length;
        }
      } catch (e) {}
    });

    const typeStats = Object.entries(typeMap)
      .map(([name, count]) => ({ name, count, percent: ((count / totalDocs) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count);

    const deptStats = Object.entries(deptMap)
      .map(([name, count]) => ({ name, count, percent: ((count / totalDocs) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      overview: {
        total: totalDocs,
        today: todayDocs,
        thisWeek: weekDocs,
        thisMonth: monthDocs,
        totalErrors,
        avgErrorsPerDoc: totalDocs > 0 ? (totalErrors / totalDocs).toFixed(2) : 0
      },
      byType: typeStats,
      byUrgency: urgencyMap,
      byDepartment: deptStats,
      generatedAt: Date.now()
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Statistika xatosi' });
  }
});

// ============ LETTER TYPES ============
app.get('/api/letter-types', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM letter_types ORDER BY id');
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

app.put('/api/letter-types', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM letter_types');
    for (const t of req.body) {
      await pool.query('INSERT INTO letter_types (id, name, description) VALUES ($1, $2, $3)', [t.id, t.name, t.description || '']);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// ============ HIERARCHY ============
app.get('/api/hierarchy', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM hierarchy WHERE id = 1');
    res.json(result.rows.length > 0 ? JSON.parse(result.rows[0].data) : []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

app.put('/api/hierarchy', authMiddleware, async (req, res) => {
  try {
    const existing = await pool.query('SELECT id FROM hierarchy WHERE id = 1');
    if (existing.rows.length > 0) {
      await pool.query('UPDATE hierarchy SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [JSON.stringify(req.body)]);
    } else {
      await pool.query('INSERT INTO hierarchy (id, data) VALUES (1, $1)', [JSON.stringify(req.body)]);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// ============ EXPORT ============
app.get('/api/export', authMiddleware, async (req, res) => {
  try {
    const { format } = req.query;

    const docsResult = await pool.query('SELECT * FROM documents ORDER BY timestamp DESC');
    const documents = docsResult.rows.map(r => ({
      id: r.id,
      timestamp: parseInt(r.timestamp),
      fileName: r.file_name,
      contentSnippet: r.content_snippet,
      fullContent: r.full_content,
      analysis: JSON.parse(r.analysis),
      createdAt: r.created_at
    }));

    const typesResult = await pool.query('SELECT * FROM letter_types');
    const letterTypes = typesResult.rows;

    const hierarchyResult = await pool.query('SELECT data FROM hierarchy WHERE id = 1');
    const hierarchy = hierarchyResult.rows.length > 0 ? JSON.parse(hierarchyResult.rows[0].data) : [];

    if (format === 'csv') {
      const headers = ['ID', 'Sana', 'Fayl nomi', 'Tur', 'Dolzarblik', "Bo'lim", 'Xatolar soni'];
      const rows = documents.map(doc => [
        doc.id,
        new Date(doc.timestamp).toISOString(),
        doc.fileName || '',
        doc.analysis?.docType || '',
        doc.analysis?.urgency || '',
        doc.analysis?.departmentOrigin || '',
        doc.analysis?.grammarErrors?.length || 0
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=xatlar-export-${Date.now()}.csv`);
      return res.send('\ufeff' + csvContent);
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      stats: { documentsCount: documents.length, letterTypesCount: letterTypes.length },
      documents,
      letterTypes,
      hierarchy
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=xatlar-export-${Date.now()}.json`);
    res.json(exportData);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Eksport xatosi' });
  }
});

// ============ USER MANAGEMENT ============
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Faqat admin uchun' });
  }
  next();
};

app.get('/api/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

app.delete('/api/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: "O'zingizni o'chira olmaysiz" });

    const result = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    if (result.rows[0].role === 'admin') return res.status(400).json({ error: "Boshqa adminni o'chira olmaysiz" });

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: "Foydalanuvchi o'chirildi" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// ============ ERROR HANDLING ============
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS xatosi' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: "Noto'g'ri JSON format" });
  }
  res.status(500).json({ error: 'Server xatosi' });
});

// ============ STATIC FILES ============
if (NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint topilmadi' });
});

// ============ START SERVER ============
let server;

async function start() {
  await ensureTables();
  server = app.listen(PORT, () => {
    console.log(`Server ishga tushdi: http://localhost:${PORT}`);
    console.log(`Muhit: ${NODE_ENV}`);
    console.log(`Database: PostgreSQL`);
  });
}

function gracefulShutdown(signal) {
  console.log(`\n${signal} signali qabul qilindi. Server yopilmoqda...`);
  server.close(async () => {
    console.log('HTTP server yopildi');
    await pool.end();
    console.log('PostgreSQL ulanishi yopildi');
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Majburiy yopish (10 soniya o'tdi)");
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start().catch(err => {
  console.error('Server ishga tushmadi:', err);
  process.exit(1);
});
