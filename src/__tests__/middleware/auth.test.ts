import { Request, Response, NextFunction } from 'express';
import { authorize } from '@/middleware/auth';
import { getTeamUserByAuth0IdAndTeamId } from '@/db/team';

// Mock the database function
jest.mock('@/db/team');
const mockGetTeamUserByAuth0IdAndTeamId = getTeamUserByAuth0IdAndTeamId as jest.MockedFunction<typeof getTeamUserByAuth0IdAndTeamId>;

describe('authorize middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      auth0Id: 'auth0|123',
      params: { teamId: '1' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('team scope', () => {
    it('should allow owner to delete team', async () => {
      mockGetTeamUserByAuth0IdAndTeamId.mockResolvedValue([{ role: 'owner' }] as any);

      const middleware = authorize('team:delete', 'team');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should deny athlete from deleting team', async () => {
      mockGetTeamUserByAuth0IdAndTeamId.mockResolvedValue([{ role: 'athlete' }] as any);

      const middleware = authorize('team:delete', 'team');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when user is not team member', async () => {
      mockGetTeamUserByAuth0IdAndTeamId.mockResolvedValue([]);

      const middleware = authorize('team:read', 'team');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('individual scope', () => {
    it('should allow user to read own profile', async () => {
      mockGetTeamUserByAuth0IdAndTeamId.mockResolvedValue([{ role: 'athlete' }] as any);

      const middleware = authorize('profile:read', 'individual');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});
