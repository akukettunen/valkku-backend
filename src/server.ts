import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from '@/routes/auth';
import { clerkMiddleware } from '@clerk/express'

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env['PORT'] || 8333;

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('combined')); // HTTP request logging
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(clerkMiddleware()); // Clerk middleware

// Basic route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Valkku Backend! 🚀',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'running',
    version: '1.0.0',
    nodeVersion: process.version
  });
});

// Mount auth routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env['NODE_ENV'] === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - catch all unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;
