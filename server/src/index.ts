import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables before anything that reads them
dotenv.config();

// --- Startup guard: fail fast if required env vars are missing ---
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`\n❌ Missing required environment variable: ${varName}`);
    console.error('Please copy .env.example to .env and fill in your Supabase credentials.');
    console.error('See: server/.env.example\n');
    process.exit(1);
  }
}

import graphRouter from './routes/graph';
import resultRouter from './routes/result';
import leaderboardRouter from './routes/leaderboard';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// --- CORS: whitelist from ALLOWED_ORIGINS env var ---
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

// --- Middleware ---
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use('/api', graphRouter);
app.use('/api', resultRouter);
app.use('/api', leaderboardRouter);

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- 404 handler ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Global error handler ---
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
