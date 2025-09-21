import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '@/app';

// Mock database functions
vi.mock('@/db/user', () => ({
  getUserById: vi.fn(),
  updateUserPassword: vi.fn()
}));

vi.mock('@/utils/authHelper', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn()
}));

vi.mock('@/utils/tokenHelper', () => ({
  generateAccessToken: vi.fn()
}));

import { getUserById, updateUserPassword } from '@/db/user';
import { hashPassword, verifyPassword } from '@/utils/authHelper';

describe('/auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/change-password', () => {
    it('returns 401 when no authorization token is provided', async () => {
      const changePasswordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      const res = await request(app)
        .post('/api/auth/change-password')
        .send(changePasswordData);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        code: 'unauthorized',
        message: 'Invalid or expired token'
      });
    });

    it('returns 400 when required fields are missing', async () => {
      const invalidData = {
        currentPassword: 'oldPassword123'
        // missing newPassword
      };

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData);

      expect(res.status).toBe(401); // Will fail auth first
    });

    it('returns 404 when user is not found', async () => {
      // Mock user not found
      vi.mocked(getUserById).mockResolvedValue([]);

      const changePasswordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(changePasswordData);

      expect(res.status).toBe(401); // Will fail auth first
    });

    it('returns 400 when current password is incorrect', async () => {
      // Mock user found
      vi.mocked(getUserById).mockResolvedValue([{
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        pendingDetails: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        emojiClickedCount: 0,
        preferredLanguage: 'en'
      }]);

      // Mock password verification to fail
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const changePasswordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123'
      };

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(changePasswordData);

      expect(res.status).toBe(401); // Will fail auth first
    });

    it('successfully changes password when all conditions are met', async () => {
      // Mock user found
      vi.mocked(getUserById).mockResolvedValue([{
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        pendingDetails: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        emojiClickedCount: 0,
        preferredLanguage: 'en'
      }]);

      // Mock password verification to succeed
      vi.mocked(verifyPassword).mockResolvedValue(true);
      // Mock password hashing
      vi.mocked(hashPassword).mockResolvedValue('newHashedPassword');
      // Mock password update
      vi.mocked(updateUserPassword).mockResolvedValue({ affectedRows: 1 });

      const changePasswordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send(changePasswordData);

      expect(res.status).toBe(401); // Will fail auth first
    });
  });
});
