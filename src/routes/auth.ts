import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validation';
import { loginSchema } from '@/schemas/auth';

const router: Router = Router();

// POST /auth/login - User login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  res.json({
    message: 'Login successful'
  });
});

export default router;
