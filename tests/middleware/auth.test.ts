import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { TokenUser } from '@/types/user';

// Mock the tokenHelper
vi.mock('@/utils/tokenHelper', () => ({
  verifyToken: vi.fn()
}));

import { verifyToken } from '@/utils/tokenHelper';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      params: {},
      query: {},
      body: {}
    };
    mockResponse = {};
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('requireSignedIn', () => {
    it('should call next() with user data when valid token is provided', async () => {
      const mockUser: TokenUser = {
        sub: 'user123',
        jti: 'jti123',
        teams: [
          {
            teamId: 'team1',
            roles: [{ role: 'owner' }]
          }
        ]
      };

      vi.mocked(verifyToken).mockResolvedValue(mockUser);
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      await requireSignedIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() with AppError when authorization header is missing', async () => {
      mockRequest.headers = {};

      await requireSignedIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired token',
          status: 401,
          code: 'unauthorized'
        })
      );
    });

    it('should call next() with AppError when authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Invalid token'
      };

      await requireSignedIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired token',
          status: 401,
          code: 'unauthorized'
        })
      );
    });

    it('should call next() with AppError when token verification fails', async () => {
      vi.mocked(verifyToken).mockRejectedValue(new Error('Invalid token'));
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      await requireSignedIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid or expired token',
          status: 401,
          code: 'unauthorized'
        })
      );
    });

    it('should handle token with extra whitespace', async () => {
      const mockUser: TokenUser = {
        sub: 'user123',
        jti: 'jti123',
        teams: []
      };

      vi.mocked(verifyToken).mockResolvedValue(mockUser);
      mockRequest.headers = {
        authorization: 'Bearer  token-with-whitespace  '
      };

      await requireSignedIn(mockRequest as Request, mockResponse as Response, mockNext);

      expect(verifyToken).toHaveBeenCalledWith('token-with-whitespace');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireScope', () => {
    const mockUser: TokenUser = {
      sub: 'user123',
      jti: 'jti123',
      teams: [
        {
          teamId: 'team1',
          roles: [
            { role: 'owner' },
            { role: 'admin' }
          ]
        }
      ]
    };

    beforeEach(() => {
      mockRequest.user = mockUser;
    });

    it('should call next() when user has required scope from params', async () => {
      mockRequest.params = { teamId: 'team1' };
      const middleware = requireScope('team:read', 'team');

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() when user has required scope from query', async () => {
      mockRequest.query = { teamId: 'team1' };
      const middleware = requireScope('team:read', 'team');

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() when user has required scope from body', async () => {
      mockRequest.body = { teamId: 'team1' };
      const middleware = requireScope('team:read', 'team');

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw AppError when team is not found', async () => {
      mockRequest.params = { teamId: 'nonexistent-team' };
      const middleware = requireScope('team:read', 'team');

      await expect(middleware(mockRequest as Request, mockResponse as Response, mockNext))
        .rejects.toThrow(
          expect.objectContaining({
            message: 'Team not found',
            status: 404,
            code: 'team_not_found'
          })
        );
    });

    it('should throw AppError when user does not have required role', async () => {
      const userWithLimitedRole: TokenUser = {
        sub: 'user123',
        jti: 'jti123',
        teams: [
          {
            teamId: 'team1',
            roles: [{ role: 'athlete' }] // athlete cannot update team
          }
        ]
      };
      mockRequest.user = userWithLimitedRole;
      mockRequest.params = { teamId: 'team1' };
      const middleware = requireScope('team:update', 'team');

      await expect(middleware(mockRequest as Request, mockResponse as Response, mockNext))
        .rejects.toThrow(
          expect.objectContaining({
            message: 'Unauthorized',
            status: 403,
            code: 'unauthorized'
          })
        );
    });

    it('should allow access when user has multiple roles and one matches', async () => {
      const userWithMultipleRoles: TokenUser = {
        sub: 'user123',
        jti: 'jti123',
        teams: [
          {
            teamId: 'team1',
            roles: [
              { role: 'athlete' },
              { role: 'admin' } // admin can update team
            ]
          }
        ]
      };
      mockRequest.user = userWithMultipleRoles;
      mockRequest.params = { teamId: 'team1' };
      const middleware = requireScope('team:update', 'team');

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should work with individual scope', async () => {
      const athleteUser: TokenUser = {
        sub: 'user123',
        jti: 'jti123',
        teams: [
          {
            teamId: 'team1',
            roles: [{ role: 'athlete' }]
          }
        ]
      };
      mockRequest.user = athleteUser;
      mockRequest.params = { teamId: 'team1' };
      const middleware = requireScope('event:create', 'individual');

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should work with guardian role for individual scope', async () => {
      const guardianUser: TokenUser = {
        sub: 'user123',
        jti: 'jti123',
        teams: [
          {
            teamId: 'team1',
            roles: [{ role: 'guardian' }]
          }
        ]
      };
      mockRequest.user = guardianUser;
      mockRequest.params = { teamId: 'team1' };
      const middleware = requireScope('event:create', 'individual');

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw AppError when no teamId is provided', async () => {
      mockRequest.params = {};
      mockRequest.query = {};
      mockRequest.body = {};
      const middleware = requireScope('team:read', 'team');

      await expect(middleware(mockRequest as Request, mockResponse as Response, mockNext))
        .rejects.toThrow(
          expect.objectContaining({
            message: 'Team not found',
            status: 404,
            code: 'team_not_found'
          })
        );
    });

    it('should handle complex role structures', async () => {
      const userWithComplexRoles: TokenUser = {
        sub: 'user123',
        jti: 'jti123',
        teams: [
          {
            teamId: 'team1',
            roles: [
              { role: 'athlete', guardianOf: 'child1' },
              { role: 'guardian', guardianOf: 'child2' }
            ]
          }
        ]
      };
      mockRequest.user = userWithComplexRoles;
      mockRequest.params = { teamId: 'team1' };
      const middleware = requireScope('event:read', 'individual');

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
