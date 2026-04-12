#!/usr/bin/env node
/**
 * CISOLens — Cross-platform setup script
 * Run via: npm run setup
 */

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const FRONTEND = path.join(ROOT, "frontend");

const c = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function run(cmd, cwd = ROOT) {
  const result = spawnSync(cmd, { shell: true, cwd, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(c.red(`\n✗ Command failed: ${cmd}`));
    process.exit(1);
  }
}

function step(n, total, label) {
  console.log(`\n${c.cyan(`[${n}/${total}]`)} ${label}`);
}

console.log(`
${c.bold(c.cyan("╔══════════════════════════════════════╗"))}
${c.bold(c.cyan("║       CISOLens — Setup               ║"))}
${c.bold(c.cyan("╚══════════════════════════════════════╝"))}
`);

// ── 1. Node version check ────────────────────────────────────────────────────
step(1, 5, "Checking Node.js version...");
const nodeVer = process.versions.node;
const nodeMajor = parseInt(nodeVer.split(".")[0], 10);
if (nodeMajor < 18) {
  console.error(c.red(`  ✗ Node.js 18+ required. Found: v${nodeVer}`));
  console.error("  Download from: https://nodejs.org");
  process.exit(1);
}
console.log(c.green(`  ✓ Node.js v${nodeVer}`));

// ── 2. Backend .env ──────────────────────────────────────────────────────────
step(2, 5, "Configuring backend environment...");
const envPath = path.join(BACKEND, ".env");
const envExamplePath = path.join(BACKEND, ".env.example");

if (!fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envExamplePath, "utf8");
  const accessSecret = crypto.randomBytes(64).toString("hex");
  const refreshSecret = crypto.randomBytes(64).toString("hex");
  envContent = envContent
    .replace("change-this-to-a-long-random-secret-in-production", accessSecret)
    .replace("change-this-too-different-from-above", refreshSecret);
  fs.writeFileSync(envPath, envContent);
  console.log(c.green("  ✓ backend/.env created with generated secrets"));
} else {
  console.log(c.yellow("  ⚠ backend/.env already exists — skipping"));
}

// ── 3. Install dependencies ──────────────────────────────────────────────────
step(3, 5, "Installing dependencies...");
console.log("  → Backend...");
run("npm install", BACKEND);
console.log(c.green("  ✓ Backend dependencies installed"));
console.log("  → Frontend...");
run("npm install", FRONTEND);
console.log(c.green("  ✓ Frontend dependencies installed"));

// ── 4. Database setup ────────────────────────────────────────────────────────
step(4, 5, "Setting up database...");
run("npx prisma migrate dev --name init", BACKEND);
console.log(c.green("  ✓ Migrations applied"));
console.log("  → Seeding demo data...");
run("npx tsx prisma/seed.ts", BACKEND);
console.log(c.green("  ✓ Database seeded"));

// ── 5. Done ──────────────────────────────────────────────────────────────────
step(5, 5, "Done!");
console.log(`
${c.bold(c.green("╔══════════════════════════════════════╗"))}
${c.bold(c.green("║       Setup Complete!                ║"))}
${c.bold(c.green("╚══════════════════════════════════════╝"))}

  ${c.bold("Demo credentials:")}
    Email:    ${c.cyan("khaled@cisolens.io")}
    Password: ${c.cyan("Demo1234!")}

  ${c.bold("Start the app:")}
    ${c.cyan("npm start")}
`);
