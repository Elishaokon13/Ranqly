"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Standalone API server only (port 4000). Prefer unified app: `npm run dev` from repo root.
 */
require("dotenv/config");
const createApiApp_1 = require("./createApiApp");
const PORT = process.env.PORT ?? 4000;
const app = (0, createApiApp_1.createApiApp)();
app.listen(PORT, () => {
    console.log(`Ranqly API (standalone) listening on http://localhost:${PORT}`);
});
