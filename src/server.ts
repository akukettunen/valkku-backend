import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { promisePoolEnd } from '@/db';
import app from './app';
import { startCronJobs } from '@/cron';

// Load environment variables with expansion
dotenvExpand.expand(dotenv.config({ quiet: true }));

const port = parseInt(process.env['PORT'] || '8333', 10);

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
  // Start background cron jobs (non-blocking)
  Promise.resolve()
    .then(() => startCronJobs())
    .catch((err) => console.error('[cron] start error', err));
});

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // Close HTTP server
  server.close(async () => {
    console.log('📡 HTTP server closed');

    try {
      // Close database connection pool
      await promisePoolEnd();
      console.log('🗄️ Database connection pool closed');
    } catch (error) {
      console.error('❌ Error closing database pool:', error);
    }

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
