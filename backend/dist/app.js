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
/**
 * Ranqly Backend — Express entrypoint
 * Run: npm run dev (or npm start after build)
 */
require("dotenv/config");
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
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 4000;
app.use(express_1.default.json());
// Optional auth for all /api routes (sets req.userId when Bearer or X-User-Id present)
app.use("/api", auth_1.optionalAuth);
app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "ranqly-backend" });
});
app.use("/api/auth", auth_2.default);
// Nested contest routes first (so /api/contests/:id/submissions etc. are not matched as contest idOrSlug)
app.use("/api/contests/:contestId/submissions", submissions_1.default);
app.use("/api/contests/:contestId/votes", votes_1.default);
app.use("/api/contests/:contestId/judges", judging_1.default);
app.use("/api/contests/:contestId/disputes", disputes_1.disputeCreateRouter);
app.use("/api/contests", contests_1.default);
app.use("/api/disputes", disputes_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/me", me_1.default);
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});
app.listen(PORT, () => {
    console.log(`Ranqly backend listening on http://localhost:${PORT}`);
});
