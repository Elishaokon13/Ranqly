/**
 * Fails the build if tsconfig.json is widened in a way that typechecks
 * backend/ (no @prisma/client at repo root on Vercel).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const tsconfigPath = path.join(root, "tsconfig.json");

let ts;
try {
  ts = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));
} catch (e) {
  console.error("[verify-next-tsconfig] Could not read tsconfig.json:", e.message);
  process.exit(1);
}

const include = ts.include ?? [];
const exclude = ts.exclude ?? [];

const dangerous = include.filter(
  (p) =>
    typeof p === "string" &&
    (p === "**/*.ts" ||
      p === "**/*.tsx" ||
      /^(\*\*\/|\*\.)[^/]*\*\.(ts|tsx|mts)$/.test(p) ||
      p.startsWith("**/"))
);

if (dangerous.length > 0) {
  console.error(
    "[verify-next-tsconfig] tsconfig.json `include` must not use repo-wide *.ts globs."
  );
  console.error("  These entries pull in backend/ and break Vercel (no @prisma/client at root):");
  dangerous.forEach((p) => console.error("   -", JSON.stringify(p)));
  console.error('  Use explicit globs: "src/**/*.ts", "src/**/*.tsx", plus next.config.ts.');
  process.exit(1);
}

if (include.includes("server.ts")) {
  console.error(
    "[verify-next-tsconfig] Do not include server.ts in tsconfig.json — it imports backend/ (Prisma) and breaks"
  );
  console.error("  `next build` on Vercel where @prisma/client is not installed at the repo root.");
  process.exit(1);
}

if (!exclude.includes("backend")) {
  console.error('[verify-next-tsconfig] tsconfig.json `exclude` must include "backend".');
  process.exit(1);
}

console.log("[verify-next-tsconfig] OK — Next.js project scope is safe for Vercel.");
