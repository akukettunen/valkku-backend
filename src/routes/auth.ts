import { Router, Request, Response } from "express";
import { signupSchema } from "@/schemas/auth";

const router: Router = Router();

router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;
});

export default router;