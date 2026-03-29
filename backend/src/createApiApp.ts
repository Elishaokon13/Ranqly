/**
 * Express API app (no listen). Used by unified server and standalone backend.
 */
import path from "path";
import fs from "fs";
import express from "express";
import { optionalAuth } from "./middleware/auth";
import authRoutes from "./routes/auth";
import contestsRoutes from "./routes/contests";
import submissionsRoutes from "./routes/submissions";
import votesRoutes from "./routes/votes";
import judgingRoutes from "./routes/judging";
import disputesRoutes, { disputeCreateRouter } from "./routes/disputes";
import adminRoutes from "./routes/admin";
import meRoutes from "./routes/me";


function resolvePublicUploadsRoot(): string | null {
  const fromRoot = path.join(process.cwd(), "public", "uploads");
  const fromBackend = path.join(process.cwd(), "..", "public", "uploads");
  if (fs.existsSync(fromRoot)) return fromRoot;
  if (fs.existsSync(fromBackend)) return fromBackend;
  return null;
}

function buildCorsAllowlist(): Set<string> {
  const defaults = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];
  const fromEnv = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "").trim();
  return new Set([...defaults, ...fromEnv, ...(site ? [site] : [])]);
}

export function createApiApp(): express.Application {
  const app = express();

  if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  const corsAllow = buildCorsAllowlist();
  const reflectOrigin =
    process.env.CORS_REFLECT_ORIGIN === "1" && process.env.NODE_ENV !== "production";

  app.use((_req, res, next) => {
    const origin = _req.headers.origin;
    if (origin) {
      if (reflectOrigin || corsAllow.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id");
    if (_req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.use(express.json());

  app.use("/api", optionalAuth);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "ranqly-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/contests/:contestId/submissions", submissionsRoutes);
  app.use("/api/contests/:contestId/votes", votesRoutes);
  app.use("/api/contests/:contestId/judges", judgingRoutes);
  app.use("/api/contests/:contestId/disputes", disputeCreateRouter);
  app.use("/api/contests", contestsRoutes);
  app.use("/api/disputes", disputesRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/me", meRoutes);

  const uploadsRoot = resolvePublicUploadsRoot();
  if (uploadsRoot) {
    app.use("/uploads", express.static(uploadsRoot, { index: false }));
  }

  app.use((req, res) => {
    console.warn("[ranqly-api] 404", req.method, req.originalUrl);
    res.status(404).json({ error: "Not found", path: req.originalUrl, method: req.method });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
