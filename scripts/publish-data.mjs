/**
 * scripts/publish-data.mjs
 *
 * Promotes the current live local data files to seeds,
 * making them the snapshot that will be deployed to Vercel.
 *
 * Usage:
 *   npm run data:publish
 *
 * What it does:
 *   Copies every *.json file from src/data/ to src/data/seeds/,
 *   overwriting the previous seeds.
 *
 * What it does NOT do:
 *   It does not deploy anything. Run `vercel --prod` or push to your
 *   deployment branch after this to publish the snapshot.
 *
 * When to use this:
 *   When an admin has finished setting up teams, players, and the auction
 *   locally and wants those results to appear on the public Vercel site.
 *
 * Who should run this:
 *   Admin only. This is an intentional, deliberate action.
 *   Running it replaces whatever seeds were previously committed.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data");
const SEEDS_DIR = path.join(DATA_DIR, "seeds");

async function publishData() {
  const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
  const jsonFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name);

  if (jsonFiles.length === 0) {
    console.error(
      "No live data files found in src/data/. " +
      "Run npm run data:init first to create them."
    );
    process.exit(1);
  }

  for (const file of jsonFiles) {
    const srcPath = path.join(DATA_DIR, file);
    const destPath = path.join(SEEDS_DIR, file);
    await fs.copyFile(srcPath, destPath);
    console.log(`Published: ${file}`);
  }

  console.log(
    "\nLocal data promoted to seeds. " +
    "Commit src/data/seeds/ and deploy to make it live on Vercel."
  );
}

publishData().catch((err) => {
  console.error("Publish failed:", err);
  process.exit(1);
});
