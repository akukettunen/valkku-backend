import { query } from '@/db/index';
import { PrivateUser } from '@/types/user';

export const bootstrapUser = async (user: PrivateUser) => {
  const { firstName, lastName } = user;
  const result = await query(`
    INSERT INTO users (firstName, lastName, password) VALUES (?, ?, ?)
  `, [firstName, lastName]);
  return result;
};

export const getUserById = async (id: string) => {
  const result = await query('SELECT * FROM users WHERE id = ?', [id]);
  return result;
};