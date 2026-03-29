/**
 * Standalone API server only (port 4000). Prefer unified app: `npm run dev` from repo root.
 */
import "dotenv/config";
import { createApiApp } from "./createApiApp";

const PORT = process.env.PORT ?? 4000;
const app = createApiApp();

app.listen(PORT, () => {
  console.log(`Ranqly API (standalone) listening on http://localhost:${PORT}`);
});
