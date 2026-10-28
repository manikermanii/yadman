import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/src/app.js';
import { checkDatabaseConnection } from './server/src/config/database.js';

async function startServer() {
  await checkDatabaseConnection();
  const app = createApp();

  // Support CLI arguments (e.g. --port 3000 --host 0.0.0.0) or environment variables
  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
  const PORT = portFromArg || Number(process.env.PORT) || 3000;

  const hostArgIndex = process.argv.indexOf('--host');
  const hostFromArg = hostArgIndex !== -1 && process.argv[hostArgIndex + 1] ? process.argv[hostArgIndex + 1] : null;
  const HOST = hostFromArg || process.env.HOST || '0.0.0.0';

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: HOST,
        port: PORT,
        hmr: isHmrDisabled ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[Yadman Server] Running on http://${HOST}:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Yadman Server] Port ${PORT} already in use, listening skipped or handled by existing process.`);
    } else {
      console.error('[Yadman Server] Server error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('[Yadman Server] Failed to start server:', err);
  process.exit(1);
});
