import cron from 'node-cron';
import { pingDbOnce } from '@/cron/pingDb';

export const startCronJobs = async () => {
  // Every 5 minutes: 0 */5 * * * *
  const expression = process.env['PING_DB_CRON'] || '*/5 * * * *'; // every 5 minutes
  await pingDbOnce();
  cron.schedule(expression, async () => {
    try {
      await pingDbOnce();
      if (process.env['NODE_ENV'] === 'development') {
        // eslint-disable-next-line no-console
        console.log('[cron] DB ping ok (cron)');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[cron] DB ping failed (cron)', err);
    }
  });
};

export default startCronJobs;
