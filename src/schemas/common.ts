import { z } from 'zod';

// Common query parameter schemas
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().transform(val => val ? parseInt(val) : 10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  category: z.string().optional(),
  tags: z.string().optional().transform(val => val ? val.split(',') : [])
});

// Common URL parameter schemas
export const idParamSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-_]+$/, 'Invalid ID format')
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Invalid slug format')
});

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters long').max(64, 'Password must be at most 64 characters long');
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters long').max(50, 'Name must be less than 50 characters');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Date validation
export const dateSchema = z.string().datetime('Invalid date format').or(z.date());

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.string().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+$/, 'Invalid MIME type'),
  size: z.number().positive('File size must be positive').max(10 * 1024 * 1024, 'File size must be less than 10MB')
});

// Export types
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type SlugParam = z.infer<typeof slugParamSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
