import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartOrderRoutes from './routes/cartOrderRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import cmsRoutes from './routes/cmsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requireAdmin } from './middleware/auth.js';
import { config } from './config/env.js';

export function createApp() {
  const app = express();

  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Core Middlewares - Robust CORS for AI Studio preview & iframe environments
  const corsMiddleware = cors({
    origin: (origin, callback) => {
      // Allow all origins in development and preview environments
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
  });
  app.use(corsMiddleware);
  app.options('*', corsMiddleware);
  app.use(cookieParser());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Static uploads directory
  app.use('/uploads', express.static(uploadDir));

  // Diagnostic route metrics (aggregated, no PII)
  const routeMetrics: Record<string, { count: number; totalDurationMs: number; totalBytes: number; errors: number }> = {};

  // Diagnostic request logger & response byte monitor
  app.use('/api', (req, res, next) => {
    const start = Date.now();
    const routeKey = `${req.method} ${req.baseUrl || ''}${req.path || ''}`;
    let sentBytes = 0;

    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk: any, ...args: any[]) {
      if (chunk) {
        sentBytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(String(chunk));
      }
      return (originalWrite as any).apply(res, [chunk, ...args]);
    };

    res.end = function (chunk: any, ...args: any[]) {
      if (chunk) {
        sentBytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(String(chunk));
      }
      return (originalEnd as any).apply(res, [chunk, ...args]);
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (!routeMetrics[routeKey]) {
        routeMetrics[routeKey] = { count: 0, totalDurationMs: 0, totalBytes: 0, errors: 0 };
      }
      routeMetrics[routeKey].count += 1;
      routeMetrics[routeKey].totalDurationMs += duration;
      routeMetrics[routeKey].totalBytes += sentBytes;
      if (res.statusCode >= 400) {
        routeMetrics[routeKey].errors += 1;
      }
    });

    next();
  });

  // Diagnostic metrics endpoint (Protected: Admins only, aggregated telemetry, no PII)
  app.get('/api/diag/metrics', requireAdmin, (req, res) => {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      routes: routeMetrics,
    });
  });

  // Diagnostic trace endpoint (Protected: Admins only in non-production, disabled in production)
  app.post('/api/diag/trace', requireAdmin, (req, res) => {
    if (config.nodeEnv === 'production') {
      return res.status(403).json({ error: 'Diagnostic trace endpoint is disabled in production.' });
    }
    const line = `[${new Date().toISOString()}] FRONTEND TRACE: ${JSON.stringify(req.body)}\n`;
    try { fs.appendFileSync('/tmp/save_trace.log', line); } catch {}
    res.json({ ok: true });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Yadman Backend API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api', authRoutes); // Seamlessly supports /api/admin/users, /api/admin/me, etc.
  app.use('/api', productRoutes);
  app.use('/api', cartOrderRoutes);
  app.use('/api/blog', blogRoutes);
  app.use('/api', reviewRoutes);
  app.use('/api', inquiryRoutes);
  app.use('/api', cmsRoutes);
  app.use('/api', uploadRoutes);

  // 404 handler for unmatched /api routes (prevents falling through to SPA HTML)
  app.use('/api', notFoundHandler);

  // Global Error Handler for API routes
  app.use('/api', errorHandler);

  return app;
}
