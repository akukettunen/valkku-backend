import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validate } from '@/middleware/validation';
import { requireSignedIn, requireScope } from '@/middleware/auth';
import { AppError } from '@/middleware/errors';

const router: Router = Router();

router.post('/plan-part-type', requireSignedIn, async (req: Request, res: Response) => {
});

export default router;