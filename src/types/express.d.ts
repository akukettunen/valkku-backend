declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number,
        teams: TeamUser[],
        jti: string,
      }
    }
  }
}

export {};
