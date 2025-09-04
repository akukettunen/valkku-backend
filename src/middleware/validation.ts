import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Validate request body
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate req.body directly against the schema
      await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };
};

// Validate query parameters
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.query);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Query validation failed',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };
};

// Validate URL parameters
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.params);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Parameter validation failed',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };
};

// Validate multiple parts of the request
export const validateRequest = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        await schemas.params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Request validation failed',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal validation error'
      });
    }
  };
};
