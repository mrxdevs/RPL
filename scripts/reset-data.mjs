/**
 * scripts/reset-data.mjs
 *
 * Resets all live data files back to their seed state.
 *
 * Usage:
 *   npm run data:reset
 *
 * What it does:
 *   Copies every file from src/data/seeds/ to src/data/,
 *   overwriting whatever is currently there.
 *
 * What it does NOT do:
 *   It does not touch src/data/seeds/ itself.
 *   It does not delete files in src/data/ that have no seed counterpart.
 *
 * Warning:
 *   Running this command erases all live tournament data.
 *   Use only when you intend to start a fresh tournament.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SEEDS_DIR = path.join(ROOT, "src", "data", "seeds");
const DATA_DIR = path.join(ROOT, "src", "data");

async function resetData() {
  const seedFiles = await fs.readdir(SEEDS_DIR);

  if (seedFiles.length === 0) {
    console.error("No seed files found in src/data/seeds/. Aborting.");
    process.exit(1);
  }

  for (const file of seedFiles) {
    if (!file.endsWith(".json")) continue;

    const seedPath = path.join(SEEDS_DIR, file);
    const destPath = path.join(DATA_DIR, file);

    await fs.copyFile(seedPath, destPath);
    console.log(`Reset: ${file}`);
  }

  console.log("\nAll data files have been reset to seed state.");
}

resetData().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
