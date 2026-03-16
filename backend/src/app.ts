/**
 * Ranqly Backend — Express entrypoint
 * Run: npm run dev (or npm start after build)
 */
import "dotenv/config";
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

const app = express();
const PORT = process.env.PORT ?? 4000;

// CORS: allow frontend origins (Next.js dev)
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:3001";
app.use((_req, res, next) => {
  const origin = _req.headers.origin;
  if (origin && corsOrigin.split(",").map((o) => o.trim()).includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id");
  if (_req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

// Optional auth for all /api routes (sets req.userId when Bearer or X-User-Id present)
app.use("/api", optionalAuth);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ranqly-backend" });
});

app.use("/api/auth", authRoutes);
// Nested contest routes first (so /api/contests/:id/submissions etc. are not matched as contest idOrSlug)
app.use("/api/contests/:contestId/submissions", submissionsRoutes);
app.use("/api/contests/:contestId/votes", votesRoutes);
app.use("/api/contests/:contestId/judges", judgingRoutes);
app.use("/api/contests/:contestId/disputes", disputeCreateRouter);
app.use("/api/contests", contestsRoutes);
app.use("/api/disputes", disputesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/me", meRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Ranqly backend listening on http://localhost:${PORT}`);
});
