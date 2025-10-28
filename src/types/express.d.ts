import { TokenUser } from "@/types/user";

declare global {
  namespace Express {
    interface Request {
      user?: TokenUser
    }
  }
}

export {};