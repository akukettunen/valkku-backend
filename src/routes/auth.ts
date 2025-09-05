import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validation';
import { loginSchema } from '@/schemas/auth';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const router: Router = Router();

// POST /auth/login - User login
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
      // Step 1: Start sign-in flow
      const signInResp = await axios.post("https://api.clerk.dev/v1/sign_ins",
        { identifier: email },
        {
          headers: {
            Authorization: `Bearer ${process.env['CLERK_SECRET_KEY']}`,
            "Content-Type": "application/json",
          },
        }
      );

      const signInId = signInResp.data.id;

      // Step 2: Attempt password factor
      const attemptResp = await axios.post(
        `https://api.clerk.dev/v1/sign_ins/${signInId}/attempt_first_factor`,
        { strategy: "password", password },
        {
          headers: {
            Authorization: `Bearer ${process.env['CLERK_SECRET_KEY']}`,
            "Content-Type": "application/json",
          },
        }
      );

      const attempt = attemptResp.data;

      if (attempt.status === "complete") {
        return res.json({
          success: true,
          sessionId: attempt.created_session_id,
          userId: attempt.user_id,
        });
      }

      return res.status(401).json({ success: false, message: "Invalid credentials" });
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      return res
        .status(400)
        .json({ success: false, error: err.response?.data || err.message });
    }
  }
);

export default router;
