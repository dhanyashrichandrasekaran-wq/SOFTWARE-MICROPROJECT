import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedDatabase } from './server/seed';
import { authMiddleware } from './server/services/auth';
import authRoutes from './server/routes/auth';
import scenarioRoutes from './server/routes/scenarios';
import attemptRoutes from './server/routes/attempts';
import analyticsRoutes from './server/routes/analytics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  // Middlewares
  app.use(express.json());
  app.use(cookieParser());
  app.use(authMiddleware);

  // Auto-seed database if empty
  try {
    await seedDatabase();
  } catch (err) {
    console.error('Database seeding failed during server startup:', err);
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'ScamQuest API',
      timestamp: new Date().toISOString(),
      database: 'SQLite (scamquest.db)',
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/scenarios', scenarioRoutes);
  app.use('/api/attempts', attemptRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Vite integration
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  return { app, port };
}

// Start server if executed directly
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  createServer().then(({ app, port }) => {
    app.listen(Number(port), '0.0.0.0', () => {
      console.log(`[ScamQuest] Full-stack application running at http://0.0.0.0:${port}`);
    });
  }).catch(err => {
    console.error('Failed to start ScamQuest server:', err);
    process.exit(1);
  });
}
