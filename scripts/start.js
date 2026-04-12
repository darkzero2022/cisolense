#!/usr/bin/env node
/**
 * CISOLens — Cross-platform start script
 * Starts backend (port 3001) and frontend (port 5173) concurrently.
 * Run via: npm start
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const BACKEND = path.join(ROOT, "backend");
const FRONTEND = path.join(ROOT, "frontend");

const c = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

// Guard: ensure setup has been run
if (!fs.existsSync(path.join(BACKEND, ".env"))) {
  console.error(c.red("\n✗ backend/.env not found."));
  console.error("  Run setup first: " + c.cyan("npm run setup\n"));
  process.exit(1);
}

if (!fs.existsSync(path.join(BACKEND, "node_modules"))) {
  console.error(c.red("\n✗ Backend node_modules not found."));
  console.error("  Run: " + c.cyan("npm run setup\n"));
  process.exit(1);
}

if (!fs.existsSync(path.join(FRONTEND, "node_modules"))) {
  console.error(c.red("\n✗ Frontend node_modules not found."));
  console.error("  Run: " + c.cyan("npm run setup\n"));
  process.exit(1);
}

console.log(`
${c.bold(c.cyan("╔══════════════════════════════════════╗"))}
${c.bold(c.cyan("║       CISOLens — Starting            ║"))}
${c.bold(c.cyan("╚══════════════════════════════════════╝"))}

  ${c.bold("Backend")}  → ${c.cyan("http://localhost:3001")}
  ${c.bold("Frontend")} → ${c.cyan("http://localhost:5173")}

  ${c.yellow("Press Ctrl+C to stop both servers")}
`);

const isWin = process.platform === "win32";
const shell = isWin ? true : false;
const npmCmd = isWin ? "npm.cmd" : "npm";

function prefixStream(stream, prefix, color) {
  const { Transform } = require("stream");
  const t = new Transform({
    transform(chunk, _enc, cb) {
      const lines = chunk.toString().split("\n");
      const out = lines
        .filter((l) => l.trim())
        .map((l) => `${color(prefix)} ${l}`)
        .join("\n");
      if (out) this.push(out + "\n");
      cb();
    },
  });
  stream.pipe(t).pipe(process.stdout);
}

const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: BACKEND,
  shell,
  env: { ...process.env },
});
prefixStream(backend.stdout, "[backend] ", c.cyan);
prefixStream(backend.stderr, "[backend] ", c.dim);

const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: FRONTEND,
  shell,
  env: { ...process.env },
});
prefixStream(frontend.stdout, "[frontend]", c.green);
prefixStream(frontend.stderr, "[frontend]", c.dim);

function cleanup() {
  console.log(c.yellow("\nStopping servers..."));
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

backend.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(c.red(`\n[backend] exited with code ${code}`));
  }
});

frontend.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(c.red(`\n[frontend] exited with code ${code}`));
  }
});
