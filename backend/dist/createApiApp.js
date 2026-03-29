"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiApp = createApiApp;
/**
 * Express API app (no listen). Used by unified server and standalone backend.
 */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
const auth_1 = require("./middleware/auth");
const auth_2 = __importDefault(require("./routes/auth"));
const contests_1 = __importDefault(require("./routes/contests"));
const submissions_1 = __importDefault(require("./routes/submissions"));
const votes_1 = __importDefault(require("./routes/votes"));
const judging_1 = __importDefault(require("./routes/judging"));
const disputes_1 = __importStar(require("./routes/disputes"));
const admin_1 = __importDefault(require("./routes/admin"));
const me_1 = __importDefault(require("./routes/me"));
function resolvePublicUploadsRoot() {
    const fromRoot = path_1.default.join(process.cwd(), "public", "uploads");
    const fromBackend = path_1.default.join(process.cwd(), "..", "public", "uploads");
    if (fs_1.default.existsSync(fromRoot))
        return fromRoot;
    if (fs_1.default.existsSync(fromBackend))
        return fromBackend;
    return null;
}
function buildCorsAllowlist() {
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
function createApiApp() {
    const app = (0, express_1.default)();
    if (process.env.TRUST_PROXY === "1") {
        app.set("trust proxy", 1);
    }
    const corsAllow = buildCorsAllowlist();
    const reflectOrigin = process.env.CORS_REFLECT_ORIGIN === "1" && process.env.NODE_ENV !== "production";
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
        if (_req.method === "OPTIONS")
            return res.sendStatus(204);
        next();
    });
    app.use(express_1.default.json());
    app.use("/api", auth_1.optionalAuth);
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", service: "ranqly-api" });
    });
    app.use("/api/auth", auth_2.default);
    app.use("/api/contests/:contestId/submissions", submissions_1.default);
    app.use("/api/contests/:contestId/votes", votes_1.default);
    app.use("/api/contests/:contestId/judges", judging_1.default);
    app.use("/api/contests/:contestId/disputes", disputes_1.disputeCreateRouter);
    app.use("/api/contests", contests_1.default);
    app.use("/api/disputes", disputes_1.default);
    app.use("/api/admin", admin_1.default);
    app.use("/api/me", me_1.default);
    const uploadsRoot = resolvePublicUploadsRoot();
    if (uploadsRoot) {
        app.use("/uploads", express_1.default.static(uploadsRoot, { index: false }));
    }
    app.use((req, res) => {
        console.warn("[ranqly-api] 404", req.method, req.originalUrl);
        res.status(404).json({ error: "Not found", path: req.originalUrl, method: req.method });
    });
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    });
    return app;
}
