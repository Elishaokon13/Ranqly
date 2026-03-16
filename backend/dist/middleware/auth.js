"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = optionalAuth;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
/**
 * Optional auth: sets req.userId and req.auth if valid Bearer token or X-User-Id (dev).
 * Does not 401 when missing.
 */
function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    const devUserId = req.headers["x-user-id"];
    if (devUserId && process.env.NODE_ENV !== "production") {
        req.userId = devUserId;
        req.auth = { userId: devUserId };
        return next();
    }
    if (header?.startsWith("Bearer ")) {
        const token = header.slice(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.userId = decoded.userId;
            req.auth = decoded;
        }
        catch {
            // invalid token — leave req.userId undefined
        }
    }
    next();
}
/**
 * Requires auth: 401 if req.userId not set. Use after optionalAuth.
 */
function requireAuth(req, res, next) {
    if (!req.userId) {
        res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
        return;
    }
    next();
}
