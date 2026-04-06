import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const isMockMode = !process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'facore-secret-key';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pool = isMockMode ? null : new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Mock data for in-memory storage
let mockUsers = [
  { id: 1, email: 'admin@facore.cl', password: '', role: 'admin' }
];
let mockFinancialRecords: any[] = [];

async function initDb() {
  if (isMockMode) {
    console.warn('DATABASE_URL not found. Running in MOCK MODE with in-memory data.');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    mockUsers[0].password = hashedPassword;
    return;
  }
  
  const client = await pool!.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS financial_records (
        id SERIAL PRIMARY KEY,
        year INTEGER NOT NULL,
        month TEXT NOT NULL,
        month_index INTEGER NOT NULL,
        ventas_netas NUMERIC NOT NULL,
        costo NUMERIC NOT NULL,
        gastos NUMERIC NOT NULL,
        resultado_mes NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(year, month_index)
      );
    `);

    // Create default admin if not exists
    const adminEmail = 'admin@facore.cl';
    const res = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (res.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [adminEmail, hashedPassword, 'admin']);
      console.log('Default admin created');
    }
  } finally {
    client.release();
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware to debug 405 errors
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for: ${email}`);
  try {
    let user;
    if (isMockMode) {
      user = mockUsers.find(u => u.email === email);
    } else {
      const result = await pool!.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    }

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      console.log(`Login successful for: ${email}`);
      res.json({ token, user: { email: user.email, role: user.role } });
    } else {
      console.log(`Login failed for: ${email}`);
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.get('/api/financial-data', authenticateToken, async (req, res) => {
  try {
    let records;
    if (isMockMode) {
      records = mockFinancialRecords;
    } else {
      const result = await pool!.query('SELECT * FROM financial_records ORDER BY year DESC, month_index ASC');
      records = result.rows;
    }
    
    res.json(records.map(row => ({
      year: row.year,
      month: row.month,
      monthIndex: row.month_index,
      ventasNetas: Number(row.ventas_netas || row.ventasNetas),
      costo: Number(row.costo),
      gastos: Number(row.gastos),
      resultadoMes: Number(row.resultado_mes || row.resultadoMes)
    })));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

app.post('/api/financial-data', authenticateToken, async (req, res) => {
  const { year, month, monthIndex, ventasNetas, costo, gastos, resultadoMes } = req.body;
  try {
    if (isMockMode) {
      const index = mockFinancialRecords.findIndex(r => r.year === year && r.monthIndex === monthIndex);
      const newRecord = { year, month, monthIndex, ventasNetas, costo, gastos, resultadoMes };
      if (index >= 0) {
        mockFinancialRecords[index] = newRecord;
      } else {
        mockFinancialRecords.push(newRecord);
      }
    } else {
      await pool!.query(`
        INSERT INTO financial_records (year, month, month_index, ventas_netas, costo, gastos, resultado_mes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (year, month_index) DO UPDATE SET
          ventas_netas = EXCLUDED.ventas_netas,
          costo = EXCLUDED.costo,
          gastos = EXCLUDED.gastos,
          resultado_mes = EXCLUDED.resultado_mes
      `, [year, month, monthIndex, ventasNetas, costo, gastos, resultadoMes]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

app.post('/api/upload-pdf', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  try {
    const data = await pdf(req.file.buffer);
    const text = data.text;
    res.json({ text, message: 'PDF procesado. Implementar lógica de extracción específica.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar PDF' });
  }
});

app.get('/api/users', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  try {
    let users;
    if (isMockMode) {
      users = mockUsers;
    } else {
      const result = await pool!.query('SELECT id, email, role, created_at FROM users');
      users = result.rows;
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/users', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (isMockMode) {
      mockUsers.push({ id: Date.now(), email, password: hashedPassword, role });
    } else {
      await pool!.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [email, hashedPassword, role]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);
  
  try {
    await initDb();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }

  // API routes are already defined on 'app' before this function is called.
  // We just need to handle static files and SPA fallback.

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      console.log(`Serving static files from: ${distPath}`);
      
      // Serve static files but skip for /api routes
      app.use((req, res, next) => {
        if (req.url.startsWith('/api')) {
          return next();
        }
        express.static(distPath)(req, res, next);
      });

      // SPA fallback
      app.get('*', (req, res) => {
        if (req.url.startsWith('/api')) {
          console.warn(`API route not found: ${req.method} ${req.url}`);
          return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.error(`Dist directory not found at: ${distPath}. Build might have failed.`);
      app.get('*', (req, res) => {
        res.status(500).send('Production build not found. Please run npm run build.');
      });
    }
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
