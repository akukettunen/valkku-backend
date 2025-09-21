import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError, notFound, errorHandler } from '../../src/middleware/errors';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnv: string | undefined;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test'
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();

    // Store original NODE_ENV
    originalEnv = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'test';

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env['NODE_ENV'] = originalEnv;
    vi.restoreAllMocks();
  });

  describe('AppError class', () => {
    it('should create AppError with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.code).toBe('bad_request');
      expect(error.name).toBe('AppError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create AppError with custom status and code', () => {
      const error = new AppError('Not found', 404, 'not_found');

      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
      expect(error.code).toBe('not_found');
      expect(error.name).toBe('AppError');
    });

    it('should create AppError with only custom status', () => {
      const error = new AppError('Unauthorized', 401);

      expect(error.message).toBe('Unauthorized');
      expect(error.status).toBe(401);
      expect(error.code).toBe('bad_request'); // default code
    });
  });

  describe('notFound middleware', () => {
    it('should call next with AppError for 404', () => {
      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Not found',
          status: 404,
          code: 'not_found',
          name: 'AppError'
        })
      );
    });

    it('should not call response methods', () => {
      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('errorHandler middleware', () => {
    describe('AppError handling', () => {
      it('should handle AppError with custom status and code', () => {
        const appError = new AppError('User not found', 404, 'user_not_found');

        errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'user_not_found',
          message: 'User not found'
        });
      });

      it('should handle AppError with default values', () => {
        const appError = new AppError('Bad request');

        errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'bad_request',
          message: 'Bad request'
        });
      });

      it('should handle AppError with 500 status', () => {
        const appError = new AppError('Internal server error', 500, 'internal_error');

        errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'internal_error',
          message: 'Internal server error'
        });
      });
    });

    describe('JSON parse error handling', () => {
      it('should handle JSON parse error', () => {
        const jsonError = new SyntaxError('Unexpected token in JSON');
        (jsonError as any).type = 'entity.parse.failed';

        errorHandler(jsonError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'invalid_json',
          message: 'Malformed JSON in request body'
        });
      });

      it('should not handle SyntaxError without entity.parse.failed type', () => {
        const syntaxError = new SyntaxError('Regular syntax error');

        errorHandler(syntaxError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'internal_error',
          message: 'Something went wrong'
        });
      });
    });

    describe('ZodError handling', () => {
      it('should handle ZodError with issues', () => {
        const zodError = {
          name: 'ZodError',
          issues: [
            {
              path: ['name'],
              message: 'Name is required'
            },
            {
              path: ['email', 'domain'],
              message: 'Invalid domain'
            }
          ]
        };

        errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'validation_error',
          message: 'Validation failed',
          issues: [
            {
              path: 'name',
              message: 'Name is required'
            },
            {
              path: 'email.domain',
              message: 'Invalid domain'
            }
          ]
        });
      });

      it('should handle ZodError with empty path', () => {
        const zodError = {
          name: 'ZodError',
          issues: [
            {
              path: [],
              message: 'Root validation error'
            }
          ]
        };

        errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'validation_error',
          message: 'Validation failed',
          issues: [
            {
              path: '',
              message: 'Root validation error'
            }
          ]
        });
      });

      it('should handle ZodError with undefined path', () => {
        const zodError = {
          name: 'ZodError',
          issues: [
            {
              message: 'Error without path'
            }
          ]
        };

        errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'validation_error',
          message: 'Validation failed',
          issues: [
            {
              path: '',
              message: 'Error without path'
            }
          ]
        });
      });
    });

    describe('JWT error handling', () => {
      it('should handle TokenExpiredError', () => {
        const tokenError = {
          name: 'TokenExpiredError',
          message: 'jwt expired'
        };

        errorHandler(tokenError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'token_expired',
          message: 'Token expired'
        });
      });

      it('should handle JsonWebTokenError', () => {
        const tokenError = {
          name: 'JsonWebTokenError',
          message: 'jwt malformed'
        };

        errorHandler(tokenError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'invalid_token',
          message: 'Invalid token'
        });
      });
    });

    describe('Generic error handling', () => {
      it('should handle unknown errors with default values', () => {
        const unknownError = new Error('Unknown error');

        errorHandler(unknownError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'internal_error',
          message: 'Something went wrong'
        });
      });

      it('should handle non-Error objects', () => {
        const nonError = 'String error';

        errorHandler(nonError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'internal_error',
          message: 'Something went wrong'
        });
      });

      it('should handle null/undefined errors', () => {
        errorHandler(null, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'internal_error',
          message: 'Something went wrong'
        });
      });
    });

    describe('Logging behavior', () => {
      it('should not log errors in test environment', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        process.env['NODE_ENV'] = 'test';

        const appError = new AppError('Test error', 400, 'test_error');
        errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      it('should log errors in non-test environment', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        process.env['NODE_ENV'] = 'development';

        const appError = new AppError('Test error', 400, 'test_error');
        errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[GET /api/test] 400 test_error:',
          appError
        );
        consoleSpy.mockRestore();
      });

      it('should log errors in production environment', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        process.env['NODE_ENV'] = 'production';

        const unknownError = new Error('Production error');
        errorHandler(unknownError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(consoleSpy).toHaveBeenCalledWith(
          '[GET /api/test] 500 internal_error:',
          unknownError
        );
        consoleSpy.mockRestore();
      });
    });

    describe('Response behavior', () => {
      it('should return after sending response', () => {
        const appError = new AppError('Test error');
        const result = errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(result).toBeUndefined();
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'bad_request',
          message: 'Test error'
        });
      });

      it('should not call next function', () => {
        const appError = new AppError('Test error');
        errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Error precedence', () => {
      it('should handle AppError correctly when it is an instance of AppError', () => {
        const appError = new AppError('App error', 400, 'app_error');

        errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

        // AppError should be handled correctly
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'app_error',
          message: 'App error'
        });
      });

      it('should handle error type checks in sequence - later checks override earlier ones', () => {
        // Create an error that matches multiple types - later checks will override
        const error = {
          name: 'TokenExpiredError',
          type: 'entity.parse.failed',
          message: 'Test error'
        };

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        // Should be handled as TokenExpiredError (last check in the chain)
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'token_expired',
          message: 'Token expired'
        });
      });

      it('should handle JSON parse error when it matches the specific type', () => {
        const jsonError = new SyntaxError('JSON parse error');
        (jsonError as any).type = 'entity.parse.failed';

        errorHandler(jsonError, mockRequest as Request, mockResponse as Response, mockNext);

        // Should be handled as JSON parse error
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'invalid_json',
          message: 'Malformed JSON in request body'
        });
      });

      it('should demonstrate that modifying error properties affects handling', () => {
        // Create an AppError but modify its name to trigger ZodError handling
        const appError = new AppError('App error', 400, 'app_error');
        (appError as any).name = 'ZodError';
        (appError as any).issues = [{ path: ['test'], message: 'Test error' }];

        errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

        // The ZodError check will override the AppError handling
        expect(mockResponse.status).toHaveBeenCalledWith(422);
        expect(mockResponse.json).toHaveBeenCalledWith({
          code: 'validation_error',
          message: 'Validation failed',
          issues: [
            {
              path: 'test',
              message: 'Test error'
            }
          ]
        });
      });
    });
  });
});
