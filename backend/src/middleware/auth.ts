import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export interface AuthPayload {
  userId: string;
  walletAddress?: string;
  email?: string;
}

export interface RequestWithAuth extends Request {
  userId?: string;
  auth?: AuthPayload;
}

/**
 * Optional auth: sets req.userId and req.auth if valid Bearer token or X-User-Id (dev).
 * Does not 401 when missing.
 */
export function optionalAuth(req: RequestWithAuth, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const devUserId = req.headers["x-user-id"] as string | undefined;

  if (devUserId && process.env.NODE_ENV !== "production") {
    req.userId = devUserId;
    req.auth = { userId: devUserId };
    return next();
  }

  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
      req.userId = decoded.userId;
      req.auth = decoded;
    } catch {
      // invalid token — leave req.userId undefined
    }
  }
  next();
}

/**
 * Requires auth: 401 if req.userId not set. Use after optionalAuth.
 */
export function requireAuth(req: RequestWithAuth, res: Response, next: NextFunction): void {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    return;
  }
  next();
}
