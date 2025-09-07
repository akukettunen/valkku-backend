import { query } from '@/db/index';

export const putUserDetails = async (user: { firstName: string; lastName: string }) => {
  const { firstName, lastName } = user;
  const result = await query(`
    INSERT INTO users (firstName, lastName) VALUES (?, ?)
  `, [firstName, lastName]);
  return result;
};

export const getUserById = async (id: string) => {
  const result = await query('SELECT * FROM users WHERE id = ?', [id]);
  return result;
};

export const getUserByAuth0Id = async (auth0Id: string) => {
  const result = await query('SELECT * FROM users WHERE auth0Id = ?', [auth0Id]);
  return result;
};

export const initializeUser = async (auth0Id: string) => {
  const result = await query(`
    INSERT INTO users (auth0Id, firstName, lastName, pendingDetails, emojiClickedCount, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, NOW(), NOW())
  `, [auth0Id, '', '', true, 0]);
  return result;
};

export const updateUser = async (emojiClickedCount: number, id: number) => {
  const result = await query(`
    UPDATE users SET emojiClickedCount = ? WHERE id = ?
  `, [emojiClickedCount, id]);
  return result;
};

export const updateUserDetails = async (updates: { emojiClickedCount?: number; firstName?: string; lastName?: string; pendingDetails?: boolean }, id: number) => {
  const fields = [];
  const values = [];

  if (updates.emojiClickedCount !== undefined) {
    fields.push('emojiClickedCount = ?');
    values.push(updates.emojiClickedCount);
  }
  if (updates.firstName !== undefined) {
    fields.push('firstName = ?');
    values.push(updates.firstName);
  }
  if (updates.lastName !== undefined) {
    fields.push('lastName = ?');
    values.push(updates.lastName);
  }
  if (updates.pendingDetails !== undefined) {
    fields.push('pendingDetails = ?');
    values.push(updates.pendingDetails);
  }

  values.push(id);

  const result = await query(`
    UPDATE users SET ${fields.join(', ')}, updatedAt = NOW() WHERE id = ?
  `, values);
  return result;
};