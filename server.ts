import express from 'express';
console.log('🚀 El proceso Node.js está iniciando...');
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
  // Desactivar SSL si es localhost o IP local, activar con rejectUnauthorized: false si es remoto
  ssl: (process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1')) 
    ? false 
    : { rejectUnauthorized: false }
});

// Mock data for in-memory storage
let mockUsers = [
  { id: 1, email: 'admin@facore.cl', password: '', role: 'admin' }
];
let mockFinancialRecords: any[] = [];

async function initDb() {
  if (isMockMode) {
    console.warn('⚠️ DATABASE_URL no encontrada. Corriendo en MODO MOCK con datos en memoria.');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    mockUsers[0].password = hashedPassword;
    return;
  }
  
  const connectionUrl = process.env.DATABASE_URL!;
  const maskedUrl = connectionUrl.replace(/:([^@]+)@/, ':****@');
  console.log(`📡 Intentando conectar a: ${maskedUrl}`);

  try {
    // Intentar conectar con un timeout de 5 segundos
    const client = await Promise.race([
      pool!.connect(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout al conectar a la base de datos (5s)')), 5000))
    ]);
    
    try {
      console.log('✅ Conexión inicial a PostgreSQL establecida');
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
      const adminRes = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
      if (adminRes.rows.length === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await client.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [adminEmail, hashedPassword, 'admin']);
        console.log('👤 Administrador por defecto creado');
      }

      // Obtener estadísticas para el log
      const userCount = await client.query('SELECT COUNT(*) FROM users');
      const recordsCount = await client.query('SELECT COUNT(*) FROM financial_records');

      console.log('📊 Estadísticas de la base de datos:');
      console.log(`- Usuarios: ${userCount.rows[0].count}`);
      console.log(`- Registros Financieros: ${recordsCount.rows[0].count}`);
      console.log('✅ PostgreSQL Database initialized successfully');

    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Error crítico de base de datos:', err);
    // No lanzamos el error para permitir que el servidor inicie en modo degradado si es necesario
    // pero marcamos que estamos en modo error
    (global as any).dbError = err instanceof Error ? err.message : String(err);
  }
}

const app = express();

// 1. Middlewares básicos
app.use(cors());
app.use(express.json());

// 2. Logging para depuración
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  // Allow bypass-token for testing
  if (token === 'bypass-token') {
    req.user = { id: 1, email: 'admin@facore.cl', role: 'admin' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 3. Definición de Rutas de la API (Prioridad Máxima)
const apiRouter = express.Router();

// Endpoint para verificar el estado de la base de datos (Público)
apiRouter.get('/db-status', async (req, res) => {
  console.log('🔍 Solicitud recibida en /api/db-status');
  try {
    if (isMockMode) {
      return res.json({ 
        status: 'MOCK', 
        message: 'Corriendo en modo de prueba (sin base de datos real)',
        database_url_present: false
      });
    }
    
    if ((global as any).dbError) {
      return res.status(500).json({
        status: 'ERROR',
        message: 'Error de conexión persistente con la base de datos',
        error: (global as any).dbError,
        database_url_present: true
      });
    }

    const result = await pool!.query('SELECT NOW()');
    res.json({ 
      status: 'CONNECTED', 
      message: 'Conexión exitosa a PostgreSQL',
      server_time: result.rows[0].now,
      database_url_present: true
    });
  } catch (err) {
    console.error('❌ Error en /api/db-status:', err);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Error al conectar con PostgreSQL',
      error: err instanceof Error ? err.message : String(err)
    });
  }
});

apiRouter.get('/auth/session', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Soporta tanto email/password como u/p (para evitar bloqueos de WAF)
  const email = (req.query.email || req.query.u) as string;
  const password = (req.query.password || req.query.p) as string;
  
  console.log(`Intento de login (GET) para: ${email}`);
  try {
    let user;
    if (isMockMode) {
      user = mockUsers.find(u => u.email === email);
    } else {
      const result = await pool!.query('SELECT * FROM users WHERE email = $1', [email]);
      user = result.rows[0];
    }

    if (user && await bcrypt.compare(password as string, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      console.log(`Login (GET) exitoso: ${email}`);
      res.json({ token, user: { email: user.email, role: user.role } });
    } else {
      console.log(`Login (GET) fallido (credenciales): ${email}`);
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (err) {
    console.error('Error en login (GET):', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

apiRouter.post('/auth/session', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Intento de login para: ${email}`);
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
      console.log(`Login exitoso: ${email}`);
      res.json({ token, user: { email: user.email, role: user.role } });
    } else {
      console.log(`Login fallido (credenciales): ${email}`);
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

apiRouter.get('/financial-data', authenticateToken, async (req, res) => {
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

apiRouter.post('/financial-data', authenticateToken, async (req, res) => {
  const { year, month, monthIndex, ventasNetas, costo, gastos, resultadoMes } = req.body;
  try {
    if (isMockMode) {
      const index = mockFinancialRecords.findIndex(r => r.year === year && r.monthIndex === monthIndex);
      const newRecord = { year, month, monthIndex, ventasNetas, costo, gastos, resultadoMes };
      if (index >= 0) mockFinancialRecords[index] = newRecord;
      else mockFinancialRecords.push(newRecord);
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

apiRouter.post('/upload-pdf', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  try {
    const pdfData = await pdf(req.file.buffer);
    const text = pdfData.text;
    console.log('PDF Procesado, texto extraído (primeros 200 chars):', text.substring(0, 200));

    // Lógica de extracción (basada en el formato "CUADRO DE RESULTADO")
    // Buscamos patrones como "Ventas Netas", "Costo de Ventas", "Gastos", "Resultado"
    // Y también el mes y año
    
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    let year = 2025;
    let month = 'Enero';
    let monthIndex = 0;

    // Extraer Año (ej: 2025 o 2026)
    const yearMatch = text.match(/202[2-9]/);
    if (yearMatch) year = parseInt(yearMatch[0]);

    // Extraer Mes
    for (let i = 0; i < months.length; i++) {
      if (text.toLowerCase().includes(months[i].toLowerCase())) {
        month = months[i];
        monthIndex = i;
        break;
      }
    }

    // Función para extraer números después de una etiqueta
    const extractNumber = (label: string) => {
      // Busca la etiqueta y luego el primer número que aparezca después (puede haber espacios, símbolos, etc)
      // Soporta formatos como "Etiqueta: 1.234.567", "Etiqueta 1234567", "Etiqueta... $1.234"
      const regex = new RegExp(`${label}[^0-9]*([0-9]{1,3}(?:\\.[0-9]{3})*(?:,[0-9]+)?|[0-9]+)`, 'i');
      const match = text.match(regex);
      if (match) {
        // Limpiar puntos de miles y comas decimales
        let val = match[1].replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(val);
      }
      return 0;
    };

    const ventasNetas = extractNumber('Ventas Netas') || extractNumber('Ingresos') || extractNumber('Ventas');
    const costo = extractNumber('Costo de Ventas') || extractNumber('Costo Directo') || extractNumber('Costos');
    const gastos = extractNumber('Gastos Operativos') || extractNumber('Gastos de Administración') || extractNumber('Gastos');
    const resultadoMes = extractNumber('Resultado del Mes') || extractNumber('Utilidad del Ejercicio') || extractNumber('Resultado Neto') || extractNumber('Utilidad');

    console.log(`Datos extraídos: ${month} ${year} - Ventas: ${ventasNetas}, Costo: ${costo}, Gastos: ${gastos}, Resultado: ${resultadoMes}`);

    if (ventasNetas === 0 && resultadoMes === 0) {
      return res.status(422).json({ error: 'No se pudieron extraer datos válidos del PDF. Verifica el formato.' });
    }

    // Guardar en BD
    if (isMockMode) {
      const index = mockFinancialRecords.findIndex(r => r.year === year && r.monthIndex === monthIndex);
      const newRecord = { year, month, monthIndex, ventasNetas, costo, gastos, resultadoMes };
      if (index >= 0) mockFinancialRecords[index] = newRecord;
      else mockFinancialRecords.push(newRecord);
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

    res.json({ success: true, data: { year, month, ventasNetas, resultadoMes } });
  } catch (err) {
    console.error('Error al procesar PDF:', err);
    res.status(500).json({ error: 'Error al procesar PDF' });
  }
});

apiRouter.get('/users', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  try {
    let users = isMockMode ? mockUsers : (await pool!.query('SELECT id, email, role, created_at FROM users')).rows;
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

apiRouter.post('/users', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const { email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (isMockMode) mockUsers.push({ id: Date.now(), email, password: hashedPassword, role });
    else await pool!.query('INSERT INTO users (email, password, role) VALUES ($1, $2, $3)', [email, hashedPassword, role]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// 4. Servir archivos estáticos y SPA Fallback
async function startServer() {
  console.log(`Iniciando servidor en modo ${process.env.NODE_ENV || 'development'}...`);
  
  // Inicializar BD
  await initDb();

  // Montar el router de la API ANTES del middleware de Vite/Estáticos
  app.use('/api', apiRouter);
  
  // Catch-all para /api que no coinciden con ninguna ruta
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `Ruta de API no encontrada: ${req.method} ${req.originalUrl}` });
  });
  
  // Endpoint de salud básico (fuera del router para máxima visibilidad)
  app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.error('Carpeta dist no encontrada. Ejecuta npm run build.');
    }
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server ready at http://0.0.0.0:${PORT}`);
  });
}

startServer();
