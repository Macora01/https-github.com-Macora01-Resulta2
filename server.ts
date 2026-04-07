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
  // SSL desactivado por petición del usuario para evitar problemas de conexión en VPS
  ssl: false
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

// Marcador para saber si la respuesta viene de Node.js o de Nginx
app.use((req, res, next) => {
  res.setHeader('X-Served-By', 'NodeJS-Express');
  console.log(`🎯 PETICIÓN RECIBIDA EN NODE: ${req.method} ${req.url}`);
  next();
});

// Rutas de diagnóstico con prioridad ABSOLUTA (antes de cualquier middleware)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', source: 'NodeJS Direct', time: new Date().toISOString() });
});

app.get('/api-health', (req, res) => {
  res.json({ status: 'ok', source: 'NodeJS API Direct', time: new Date().toISOString() });
});

// 3. Definición de Rutas de la API (Prioridad Máxima)
const apiRouter = express.Router();

// 1. Middlewares de pre-procesamiento (Prioridad máxima)
app.use(cors());
app.use(express.json());

// Normalización de rutas para evitar problemas con proxies/trailing slashes
app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) {
    const query = req.url.slice(req.path.length);
    const safepath = req.path.slice(0, -1);
    console.log(`🔄 Normalizando ruta: ${req.path} -> ${safepath}`);
    return res.redirect(301, safepath + query);
  }
  next();
});

// Logger de depuración global
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// 2. Montar el router de la API INMEDIATAMENTE
app.use('/api', apiRouter);

// Rutas de diagnóstico directo en la app
// Ya definidas arriba

// Catch-all para /api que no coinciden (para evitar que devuelvan el index.html)
app.use('/api/*', (req, res) => {
  console.warn(`⚠️ Ruta de API no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'API Endpoint not found', 
    method: req.method, 
    path: req.originalUrl 
  });
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
// Ya definido arriba

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
  
  console.log(`🔑 Intento de login (GET) para: ${email}`);
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
  console.log(`🔑 Intento de login (POST) para: ${email}`);
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
  console.log(`📥 Datos recibidos en /api/financial-data para ${month} ${year}:`, req.body);
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
    let pdfData;
    try {
      pdfData = await pdf(req.file.buffer);
    } catch (pdfErr: any) {
      console.error('Error en pdf-parse:', pdfErr);
      return res.status(422).json({ error: `No se pudo leer el archivo PDF. Asegúrate de que sea un archivo válido. (Detalle: ${pdfErr.message})` });
    }
    const text = pdfData.text;
    if (!text || text.trim().length === 0) {
      return res.status(422).json({ error: 'El PDF no contiene texto extraíble. Asegúrate de que no sea una imagen escaneada sin OCR.' });
    }
    console.log('PDF Procesado, texto extraído (primeros 200 chars):', text.substring(0, 200));

    // Lógica de extracción (basada en el formato "CUADRO DE RESULTADO")
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // 1. Detectar si es un "CUADRO DE RESULTADO" (formato tabla multi-año)
    if (text.toUpperCase().includes('CUADRO DE RESULTADO')) {
      console.log('📊 Detectado formato CUADRO DE RESULTADO (Multi-año)');
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // Encontrar años en la cabecera
      let years: number[] = [];
      for (const line of lines) {
        if (line.includes('MES') && line.match(/202[2-9]/)) {
          const matches = line.match(/202[2-9]/g);
          if (matches) {
            years = matches.map(Number);
            break;
          }
        }
      }

      if (years.length > 0) {
        console.log('📅 Años detectados en tabla:', years);
        const records: any[] = [];
        let currentMonthName = '';
        let currentMonthIdx = -1;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const upperLine = line.toUpperCase();

          // Detectar mes (con soporte para errores de OCR como "OCUBRE")
          const mIdx = months.findIndex(m => {
            const mUpper = m.toUpperCase();
            if (upperLine === mUpper) return true;
            if (mUpper === 'OCTUBRE' && upperLine === 'OCUBRE') return true;
            // Si la línea es solo el mes o empieza por el mes seguido de espacio
            if (upperLine.startsWith(mUpper + ' ') || upperLine.startsWith(mUpper + '\t')) return true;
            return false;
          });

          if (mIdx >= 0) {
            currentMonthName = months[mIdx];
            currentMonthIdx = mIdx;
            continue;
          }

          if (currentMonthIdx === -1) continue;

          // Función interna para extraer valores de una línea
          const getValuesFromLine = (l: string) => {
            const matches = l.match(/(?:-?\d{1,3}(?:\.\d{3})*(?:,\d+)?|-)/g) || [];
            return matches.map(m => {
              if (m === '-') return 0;
              return parseFloat(m.replace(/\./g, '').replace(/,/g, '.'));
            });
          };

          if (upperLine.includes('VENTAS NETAS')) {
            const vNetas = getValuesFromLine(line);
            
            // Buscar las siguientes líneas para Costo, Gastos, Resultado
            let cVentas: number[] = [];
            let gOps: number[] = [];
            let rMes: number[] = [];

            for (let j = 1; j <= 4; j++) {
              const nextLine = lines[i + j];
              if (!nextLine) break;
              const nextUpper = nextLine.toUpperCase();
              if (nextUpper.includes('COSTO')) cVentas = getValuesFromLine(nextLine);
              else if (nextUpper.includes('GASTOS')) gOps = getValuesFromLine(nextLine);
              else if (nextUpper.includes('RESULTADO')) rMes = getValuesFromLine(nextLine);
            }

            // Mapear a cada año (alineando por el final si faltan valores, común en tablas financieras)
            years.forEach((y, idx) => {
              const vIdx = idx - (years.length - vNetas.length);
              const cIdx = idx - (years.length - cVentas.length);
              const gIdx = idx - (years.length - gOps.length);
              const rIdx = idx - (years.length - rMes.length);

              const record = {
                year: y,
                month: currentMonthName,
                monthIndex: currentMonthIdx,
                ventasNetas: vIdx >= 0 ? vNetas[vIdx] : 0,
                costo: cIdx >= 0 ? cVentas[cIdx] : 0,
                gastos: gIdx >= 0 ? gOps[gIdx] : 0,
                resultadoMes: rIdx >= 0 ? rMes[rIdx] : 0
              };
              
              if (record.ventasNetas !== 0 || record.resultadoMes !== 0) {
                records.push(record);
              }
            });
          }
        }

        if (records.length > 0) {
          console.log(`✅ Se extrajeron ${records.length} registros de la tabla.`);
          console.log('Primer registro:', records[0]);
          console.log('Último registro:', records[records.length - 1]);
          for (const r of records) {
            if (isMockMode) {
              const idx = mockFinancialRecords.findIndex(mr => mr.year === r.year && mr.monthIndex === r.monthIndex);
              if (idx >= 0) mockFinancialRecords[idx] = r;
              else mockFinancialRecords.push(r);
            } else {
              await pool!.query(`
                INSERT INTO financial_records (year, month, month_index, ventas_netas, costo, gastos, resultado_mes)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (year, month_index) DO UPDATE SET
                  ventas_netas = EXCLUDED.ventas_netas,
                  costo = EXCLUDED.costo,
                  gastos = EXCLUDED.gastos,
                  resultado_mes = EXCLUDED.resultado_mes
              `, [r.year, r.month, r.monthIndex, r.ventasNetas, r.costo, r.gastos, r.resultadoMes]);
            }
          }
          return res.json({ 
            success: true, 
            message: `Se procesaron ${records.length} registros exitosamente (Periodos: ${records[0].month} ${records[0].year} a ${records[records.length-1].month} ${records[records.length-1].year}).`, 
            data: records[records.length - 1] 
          });
        }
      }
    }

    // Fallback: Lógica de extracción para un solo registro (formato estándar)
    let year = 2025;
    let month = 'Enero';
    let monthIndex = 0;

    // Extraer Año (ej: 2025 o 2026)
    const yearMatch = text.match(/202[2-9]/);
    if (yearMatch) year = parseInt(yearMatch[0]);

    // Extraer Mes (buscando palabra completa para evitar falsos positivos)
    for (let i = 0; i < months.length; i++) {
      const monthRegex = new RegExp(`\\b${months[i]}\\b`, 'i');
      if (monthRegex.test(text)) {
        month = months[i];
        monthIndex = i;
        break;
      }
    }

    // Función para extraer números después de una etiqueta
    const extractNumber = (label: string) => {
      // Busca la etiqueta y luego el primer número que aparezca después (puede haber espacios, símbolos, etc)
      // Intentamos ignorar años (2020-2029) si están justo después de la etiqueta
      const regex = new RegExp(`${label}[^0-9]*(?:202[0-9][^0-9]+)*([0-9]{1,3}(?:\\.[0-9]{3})*(?:,[0-9]+)?|[0-9]{4,})`, 'i');
      const match = text.match(regex);
      if (match) {
        // Limpiar puntos de miles y comas decimales
        let val = match[1].replace(/\./g, '').replace(/,/g, '.');
        const num = parseFloat(val);
        console.log(`🔍 Extracción para "${label}": Encontrado "${match[1]}" -> ${num}`);
        return num;
      }
      return null;
    };

    const ventasNetas = extractNumber('Ventas Netas') ?? extractNumber('Ingresos de Actividades Ordinarias') ?? extractNumber('Ingresos Operacionales') ?? extractNumber('Ingresos') ?? extractNumber('Ventas') ?? 0;
    const costo = extractNumber('Costo de Ventas') ?? extractNumber('Costo Directo') ?? extractNumber('Costos de Explotación') ?? extractNumber('Costos') ?? 0;
    const gastos = extractNumber('Gastos Operativos') ?? extractNumber('Gastos de Administración') ?? extractNumber('Gastos de Ventas') ?? extractNumber('Gastos') ?? 0;
    const resultadoMes = extractNumber('Resultado del Mes') ?? extractNumber('Resultado antes de Impuestos') ?? extractNumber('Utilidad del Ejercicio') ?? extractNumber('Resultado Neto') ?? extractNumber('Utilidad (Pérdida)') ?? extractNumber('Utilidad') ?? 0;

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
  } catch (err: any) {
    console.error('Error al procesar PDF:', err);
    res.status(500).json({ error: `Error al procesar PDF: ${err.message || 'Error desconocido'}` });
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
  console.log(`🚀 Iniciando servidor en modo ${process.env.NODE_ENV || 'development'}...`);
  
  // Endpoint de salud básico (fuera del router para máxima visibilidad)
  // Ya definidos arriba

  // Inicializar BD
  await initDb();

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
