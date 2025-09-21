/// <reference path="./types/express.d.ts" />

import 'express-async-errors';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFound } from '@/middleware/errors';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/user';
import teamRoutes from '@/routes/team';

// Load environment variables
dotenv.config({ quiet: true });

const app: Express = express();

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('combined')); // HTTP request logging
// CORS (environment-aware)
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const envOrigins = (process.env['CORS_ORIGINS'] || process.env['CORS_ORIGIN'] || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const defaultOriginsByEnv: Record<string, string[]> = {
  development: [
    'http://localhost:3000',
  ],
  staging: [
    'https://dev.d1k20vvxxmhyxj.amplifyapp.com',
    'https://dev.d1k20vvxxmhyxj.amplifyapp.com',
  ],
  production: [
    'https://valkku.ai',
    'https://app.valkku.ai',
    'https://www.valkku.ai',
    'https://valkku.com',
    'https://app.valkku.com',
    'https://www.valkku.com',
  ]
};

const allowedOrigins = Array.from(new Set([...(defaultOriginsByEnv[NODE_ENV] || []), ...envOrigins]));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, tests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions)); // Enable CORS
app.options('*', cors(corsOptions));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser());

// Trust proxy
app.set('trust proxy', 1)

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

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/team', teamRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
