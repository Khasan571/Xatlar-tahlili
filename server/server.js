import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import fsNode from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'xatlar-tahlili-secret-2024';
const JWT_EXPIRES_IN = '7d';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Allowed origins for CORS
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

// SQLite database
const dbPath = path.resolve(__dirname, '../data.db');
const db = new Database(dbPath);

const app = express();

// ============ SECURITY MIDDLEWARE ============
// Helmet - xavfsizlik headerlari
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false
}));

// Compression - javoblarni siqish
app.use(compression());

// Morgan - request logging
const logFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// CORS - domenlarni cheklash
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    if (NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// ============ RATE LIMITING ============
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 500, // 500 ta so'rov
  message: { error: "Juda ko'p so'rov. 15 daqiqadan keyin urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 10, // 10 ta urinish
  message: { error: "Juda ko'p urinish. 15 daqiqadan keyin urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============ INPUT VALIDATION HELPERS ============
const validateString = (value, minLen = 1, maxLen = 1000) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= minLen && trimmed.length <= maxLen;
};

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
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

// Initialize database
function ensureTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      file_name TEXT,
      content_snippet TEXT,
      full_content TEXT NOT NULL,
      analysis TEXT NOT NULL,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS letter_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS hierarchy (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default admin
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, username, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), 'admin', adminPassword, 'Administrator', 'admin');
    console.log('Admin yaratildi: admin / admin123');
  }

  // Seed letter types
  const ltCount = db.prepare('SELECT COUNT(*) as count FROM letter_types').get();
  if (ltCount.count === 0) {
    const types = [
      { id: 'lt-1', name: "Ta'lim sifatini nazorat qilish", desc: "Dars sifati" },
      { id: 'lt-2', name: "O'quv reja va dasturlar", desc: "Rejalar" },
      { id: 'lt-3', name: "Kredit-modul tizimi", desc: "Kredit tizimi" },
      { id: 'lt-4', name: "Yakuniy nazorat", desc: "Imtihonlar" },
      { id: 'lt-5', name: "Talabalar masalalari", desc: "Talabalar" }
    ];
    const stmt = db.prepare('INSERT INTO letter_types (id, name, description) VALUES (?, ?, ?)');
    for (const t of types) stmt.run(t.id, t.name, t.desc);
  }

  // Seed hierarchy
  const hCount = db.prepare('SELECT COUNT(*) as count FROM hierarchy').get();
  if (hCount.count === 0) {
    try {
      const hp = path.resolve(__dirname, '../vazir_hierarchy.json');
      const content = fsNode.readFileSync(hp, 'utf-8');
      db.prepare('INSERT INTO hierarchy (id, data) VALUES (1, ?)').run(content);
    } catch (e) {
      console.log('Hierarchy file not found, using empty');
      db.prepare('INSERT INTO hierarchy (id, data) VALUES (1, ?)').run('[]');
    }
  }

  console.log('Database tayyor!');
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, fullName } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username va parol majburiy' });
    if (password.length < 6) return res.status(400).json({ error: 'Parol kamida 6 belgi' });

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) return res.status(400).json({ error: 'Username mavjud' });

    const passwordHash = bcrypt.hashSync(password, 10);
    const id = randomUUID();
    db.prepare('INSERT INTO users (id, username, password_hash, full_name) VALUES (?, ?, ?, ?)')
      .run(id, username, passwordHash, fullName || username);

    const token = jwt.sign({ id, username, fullName: fullName || username, role: 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.status(201).json({ token, user: { id, username, fullName: fullName || username, role: 'user' } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Xatolik' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username va parol majburiy' });

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
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
app.post('/api/auth/change-password', authMiddleware, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Joriy va yangi parol majburiy' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Yangi parol kamida 6 belgi bo\'lishi kerak' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'Yangi parol joriy paroldan farq qilishi kerak' });
    }

    // Get user from database
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    // Verify current password
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Joriy parol noto\'g\'ri' });
    }

    // Update password
    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, req.user.id);

    res.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Parolni o\'zgartirishda xatolik' });
  }
});

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ============ DOCUMENTS WITH PAGINATION ============
app.get('/api/documents', authMiddleware, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    // Get total count
    const totalRow = db.prepare('SELECT COUNT(*) as total FROM documents').get();
    const total = totalRow.total;

    // Get paginated documents
    const rows = db.prepare('SELECT * FROM documents ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset);
    const docs = rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      fileName: r.file_name,
      contentSnippet: r.content_snippet,
      fullContent: r.full_content,
      analysis: JSON.parse(r.analysis)
    }));

    res.json({
      documents: docs,
      pagination: {
        page,
        limit,
        total,
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

// Get single document
app.get('/api/documents/:id', authMiddleware, (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Hujjat topilmadi' });

    res.json({
      id: row.id,
      timestamp: row.timestamp,
      fileName: row.file_name,
      contentSnippet: row.content_snippet,
      fullContent: row.full_content,
      analysis: JSON.parse(row.analysis)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// Create/Update document
app.post('/api/documents', authMiddleware, (req, res) => {
  try {
    const { fileName, contentSnippet, fullContent, analysis, timestamp } = req.body;

    // Validation
    if (!analysis || !fullContent) {
      return res.status(400).json({ error: 'analysis va fullContent majburiy' });
    }
    if (!validateString(fullContent, 1, 100000)) {
      return res.status(400).json({ error: 'fullContent 100000 belgidan oshmasligi kerak' });
    }

    const id = req.body.id || randomUUID();
    const ts = timestamp || Date.now();
    const sanitizedContent = sanitizeString(fullContent);

    db.prepare(`
      INSERT INTO documents (id, timestamp, file_name, content_snippet, full_content, analysis, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        timestamp = excluded.timestamp,
        file_name = excluded.file_name,
        content_snippet = excluded.content_snippet,
        full_content = excluded.full_content,
        analysis = excluded.analysis
    `).run(id, ts, fileName || null, contentSnippet || '', sanitizedContent, JSON.stringify(analysis), req.user.id);

    res.status(201).json({ id, timestamp: ts, fileName, contentSnippet, fullContent: sanitizedContent, analysis });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete document
app.delete('/api/documents/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // Check if document exists
    const existing = db.prepare('SELECT id FROM documents WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Hujjat topilmadi' });
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    res.json({ success: true, message: "Hujjat o'chirildi" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// ============ SEARCH ENDPOINT ============
app.get('/api/search', authMiddleware, (req, res) => {
  try {
    const { q, type, urgency, dateFrom, dateTo } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let params = [];

    // Text search
    if (q && q.trim()) {
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      whereClauses.push(`(
        LOWER(full_content) LIKE ? OR
        LOWER(content_snippet) LIKE ? OR
        LOWER(file_name) LIKE ? OR
        LOWER(analysis) LIKE ?
      )`);
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Type filter
    if (type && type !== 'all') {
      whereClauses.push(`JSON_EXTRACT(analysis, '$.docType') = ?`);
      params.push(type);
    }

    // Urgency filter
    if (urgency && urgency !== 'all') {
      whereClauses.push(`JSON_EXTRACT(analysis, '$.urgency') = ?`);
      params.push(urgency);
    }

    // Date range filter
    if (dateFrom) {
      whereClauses.push(`timestamp >= ?`);
      params.push(parseInt(dateFrom));
    }
    if (dateTo) {
      whereClauses.push(`timestamp <= ?`);
      params.push(parseInt(dateTo));
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total
    const countSQL = `SELECT COUNT(*) as total FROM documents ${whereSQL}`;
    const totalRow = db.prepare(countSQL).get(...params);
    const total = totalRow.total;

    // Get results
    const dataSQL = `SELECT * FROM documents ${whereSQL} ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    const rows = db.prepare(dataSQL).all(...params, limit, offset);

    const docs = rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      fileName: r.file_name,
      contentSnippet: r.content_snippet,
      fullContent: r.full_content,
      analysis: JSON.parse(r.analysis)
    }));

    res.json({
      results: docs,
      query: { q, type, urgency, dateFrom, dateTo },
      pagination: {
        page,
        limit,
        total,
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

// ============ STATISTICS ENDPOINT ============
app.get('/api/stats', authMiddleware, (req, res) => {
  try {
    // Total documents
    const totalDocs = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;

    // Today's documents
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayDocs = db.prepare('SELECT COUNT(*) as count FROM documents WHERE timestamp >= ?').get(todayStart.getTime()).count;

    // This week's documents
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekDocs = db.prepare('SELECT COUNT(*) as count FROM documents WHERE timestamp >= ?').get(weekAgo).count;

    // This month's documents
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthDocs = db.prepare('SELECT COUNT(*) as count FROM documents WHERE timestamp >= ?').get(monthAgo).count;

    // Documents by type
    const allDocs = db.prepare('SELECT analysis FROM documents').all();
    const typeMap = {};
    const urgencyMap = { High: 0, Medium: 0, Low: 0 };
    const deptMap = {};
    let totalErrors = 0;

    allDocs.forEach(row => {
      try {
        const analysis = JSON.parse(row.analysis);

        // Type stats
        const docType = analysis.docType || 'Aniqlanmagan';
        typeMap[docType] = (typeMap[docType] || 0) + 1;

        // Urgency stats
        if (analysis.urgency && urgencyMap[analysis.urgency] !== undefined) {
          urgencyMap[analysis.urgency]++;
        }

        // Department stats
        const dept = analysis.departmentOrigin || 'Aniqlanmagan';
        deptMap[dept] = (deptMap[dept] || 0) + 1;

        // Error count
        if (analysis.grammarErrors) {
          totalErrors += analysis.grammarErrors.length;
        }
      } catch (e) {}
    });

    // Convert to arrays
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

// Letter types
app.get('/api/letter-types', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM letter_types ORDER BY id').all();
    res.json(rows);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/letter-types', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM letter_types').run();
    const stmt = db.prepare('INSERT INTO letter_types (id, name, description) VALUES (?, ?, ?)');
    for (const t of req.body) {
      stmt.run(t.id, t.name, t.description || '');
    }
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// Hierarchy
app.get('/api/hierarchy', authMiddleware, (req, res) => {
  try {
    const row = db.prepare('SELECT data FROM hierarchy WHERE id = 1').get();
    res.json(row ? JSON.parse(row.data) : []);
  } catch { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/hierarchy', authMiddleware, (req, res) => {
  try {
    db.prepare('INSERT INTO hierarchy (id, data, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP')
      .run(JSON.stringify(req.body));
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// ============ BULK OPERATIONS ============
// Bulk delete documents
app.post('/api/documents/bulk-delete', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "O'chirish uchun hujjat ID lari kerak" });
    }

    if (ids.length > 100) {
      return res.status(400).json({ error: "Bir vaqtda 100 tadan ortiq hujjat o'chirib bo'lmaydi" });
    }

    // Validate all IDs are strings
    if (!ids.every(id => typeof id === 'string')) {
      return res.status(400).json({ error: "Barcha ID lar string bo'lishi kerak" });
    }

    const placeholders = ids.map(() => '?').join(',');
    const result = db.prepare(`DELETE FROM documents WHERE id IN (${placeholders})`).run(...ids);

    res.json({
      success: true,
      deleted: result.changes,
      message: `${result.changes} ta hujjat o'chirildi`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Hujjatlarni o'chirishda xatolik" });
  }
});

// ============ DATA EXPORT ============
// Export all data (for backup)
app.get('/api/export', authMiddleware, (req, res) => {
  try {
    const { format } = req.query; // json or csv

    // Get all documents
    const documents = db.prepare('SELECT * FROM documents ORDER BY timestamp DESC').all().map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      fileName: r.file_name,
      contentSnippet: r.content_snippet,
      fullContent: r.full_content,
      analysis: JSON.parse(r.analysis),
      createdAt: r.created_at
    }));

    // Get letter types
    const letterTypes = db.prepare('SELECT * FROM letter_types').all();

    // Get hierarchy
    const hierarchyRow = db.prepare('SELECT data FROM hierarchy WHERE id = 1').get();
    const hierarchy = hierarchyRow ? JSON.parse(hierarchyRow.data) : [];

    if (format === 'csv') {
      // Export documents as CSV
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
      return res.send('\ufeff' + csvContent); // BOM for Excel UTF-8
    }

    // Default: JSON export
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      stats: {
        documentsCount: documents.length,
        letterTypesCount: letterTypes.length
      },
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

// ============ USER MANAGEMENT (Admin only) ============
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Faqat admin uchun' });
  }
  next();
};

// Get all users (admin only)
app.get('/api/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: "O'zingizni o'chira olmaysiz" });
    }

    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    // Prevent deleting other admins (optional security)
    if (user.role === 'admin') {
      return res.status(400).json({ error: "Boshqa adminni o'chira olmaysiz" });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true, message: "Foydalanuvchi o'chirildi" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// Update user role (admin only)
app.patch('/api/users/:id/role', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Role 'user' yoki 'admin' bo'lishi kerak" });
    }

    // Prevent changing your own role
    if (id === req.user.id) {
      return res.status(400).json({ error: "O'z rolingizni o'zgartira olmaysiz" });
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    res.json({ success: true, message: "Rol yangilandi" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

// ============ ERROR HANDLING ============
// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS xatosi: Bu domen ruxsat etilmagan' });
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: "Noto'g'ri JSON format" });
  }

  res.status(500).json({ error: 'Server xatosi' });
});

// ============ STATIC FILES (Production) ============
if (NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');

  // Serve static files
  app.use(express.static(distPath));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// 404 handler (only for API routes in production)
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint topilmadi' });
});

// ============ GRACEFUL SHUTDOWN ============
let server;

function gracefulShutdown(signal) {
  console.log(`\n${signal} signali qabul qilindi. Server yopilmoqda...`);

  server.close(() => {
    console.log('HTTP server yopildi');

    // Close database connection
    try {
      db.close();
      console.log('Database ulanishi yopildi');
    } catch (e) {
      console.error('Database yopishda xato:', e);
    }

    console.log('Server muvaffaqiyatli yopildi');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Majburiy yopish (10 soniya o\'tdi)');
    process.exit(1);
  }, 10000);
}

// Start server
ensureTables();
server = app.listen(PORT, () => {
  console.log(`Server ishga tushdi: http://localhost:${PORT}`);
  console.log(`Muhit: ${NODE_ENV}`);
});

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
