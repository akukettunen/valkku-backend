import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateQuery, validateParams, validateRequest } from '../../src/middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {}
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('validate', () => {
    const userSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email format'),
      age: z.number().min(18, 'Must be at least 18 years old')
    });

    it('should call next() when validation passes', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };

      const middleware = validate(userSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should forward ZodError to next() for global error handler', async () => {
      mockRequest.body = {
        name: '',
        email: 'invalid-email',
        age: 16
      };

      const middleware = validate(userSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should forward ZodError when required fields are missing', async () => {
      mockRequest.body = {
        name: 'John Doe'
        // missing email and age
      };

      const middleware = validate(userSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should forward ZodError for nested object validation', async () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            firstName: z.string().min(1),
            lastName: z.string().min(1)
          })
        })
      });

      mockRequest.body = {
        user: {
          profile: {
            firstName: '',
            lastName: ''
          }
        }
      };

      const middleware = validate(nestedSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    const querySchema = z.object({
      page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)),
      limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1).max(100)),
      search: z.string().optional()
    });

    it('should call next() when query validation passes', async () => {
      mockRequest.query = {
        page: '1',
        limit: '10',
        search: 'test'
      };

      const middleware = validateQuery(querySchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should forward ZodError when query parameters are invalid', async () => {
      mockRequest.query = {
        page: '0',
        limit: '200',
        search: ''
      };

      const middleware = validateQuery(querySchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should forward ZodError when missing required query parameters', async () => {
      mockRequest.query = {
        search: 'test'
        // missing page and limit
      };

      const middleware = validateQuery(querySchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('validateParams', () => {
    const paramsSchema = z.object({
      id: z.string().uuid('Invalid UUID format'),
      teamId: z.string().min(1, 'Team ID is required')
    });

    it('should call next() when params validation passes', async () => {
      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        teamId: 'team-123'
      };

      const middleware = validateParams(paramsSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should forward ZodError when params are invalid', async () => {
      mockRequest.params = {
        id: 'invalid-uuid',
        teamId: ''
      };

      const middleware = validateParams(paramsSchema);
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('validateRequest', () => {
    const bodySchema = z.object({
      name: z.string().min(1),
      email: z.string().email()
    });

    const querySchema = z.object({
      page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1))
    });

    const paramsSchema = z.object({
      id: z.string().uuid()
    });

    it('should call next() when all validations pass', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      mockRequest.query = { page: '1' };
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateRequest({
        body: bodySchema,
        query: querySchema,
        params: paramsSchema
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate only specified schemas', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      mockRequest.query = { page: '1' };
      // No params provided, but params schema not specified

      const middleware = validateRequest({
        body: bodySchema,
        query: querySchema
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should forward ZodError when body validation fails', async () => {
      mockRequest.body = {
        name: '',
        email: 'invalid-email'
      };
      mockRequest.query = { page: '1' };
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateRequest({
        body: bodySchema,
        query: querySchema,
        params: paramsSchema
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should forward ZodError when query validation fails', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      mockRequest.query = { page: '0' }; // Invalid page
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };

      const middleware = validateRequest({
        body: bodySchema,
        query: querySchema,
        params: paramsSchema
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should forward ZodError when params validation fails', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      mockRequest.query = { page: '1' };
      mockRequest.params = { id: 'invalid-uuid' };

      const middleware = validateRequest({
        body: bodySchema,
        query: querySchema,
        params: paramsSchema
      });

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle empty schemas object', async () => {
      const middleware = validateRequest({});

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should forward non-ZodError exceptions in validate', async () => {
      const schema = z.object({
        name: z.string()
      });

      // Mock schema.parseAsync to throw a non-ZodError
      const middleware = validate(schema);

      // Create a mock that throws a generic error
      const originalParseAsync = schema.parseAsync;
      vi.spyOn(schema, 'parseAsync').mockRejectedValueOnce(new Error('Database connection failed'));

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();

      // Restore original method
      schema.parseAsync = originalParseAsync;
    });

    it('should forward non-ZodError exceptions in validateQuery', async () => {
      const schema = z.object({
        page: z.string()
      });

      const middleware = validateQuery(schema);

      const originalParseAsync = schema.parseAsync;
      vi.spyOn(schema, 'parseAsync').mockRejectedValueOnce(new Error('Network error'));

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();

      schema.parseAsync = originalParseAsync;
    });

    it('should forward non-ZodError exceptions in validateParams', async () => {
      const schema = z.object({
        id: z.string()
      });

      const middleware = validateParams(schema);

      const originalParseAsync = schema.parseAsync;
      vi.spyOn(schema, 'parseAsync').mockRejectedValueOnce(new Error('Service unavailable'));

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();

      schema.parseAsync = originalParseAsync;
    });

    it('should forward non-ZodError exceptions in validateRequest', async () => {
      const bodySchema = z.object({
        name: z.string()
      });

      const middleware = validateRequest({ body: bodySchema });

      const originalParseAsync = bodySchema.parseAsync;
      vi.spyOn(bodySchema, 'parseAsync').mockRejectedValueOnce(new Error('Unexpected error'));

      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();

      bodySchema.parseAsync = originalParseAsync;
    });
  });
});
