import { query } from '@/db';

export const pingDbOnce = async () => {
  console.log('🌐 Pinging DB');
  await query('SELECT 1');
};

export default pingDbOnce;
