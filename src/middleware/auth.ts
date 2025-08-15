import { NextFunction, Request, Response } from "express";
import redisClient from "../config/redisClient";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string; email: string };
    }
  }
}

export async function sessionRenewMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const exists = await redisClient.exists(`session:${token}`);
    if (!exists) {
      return res.status(401).json({ message: "Session expired or invalid" });
    }
    await redisClient.expire(`session:${token}`, 60);

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
}
