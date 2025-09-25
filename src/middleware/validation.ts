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
      return next(error);
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
      return next(error);
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
      return next(error);
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
      return next(error);
    }
  };
};
