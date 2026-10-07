/**
 * jsonStore.ts
 *
 * Safe atomic read and write helpers for local JSON data files.
 *
 * Environment behaviour:
 *
 *   Local development (DATA_DIR/name.json exists):
 *     readJson  - reads from src/data/{name}.json
 *     writeJson - writes atomically to src/data/{name}.json
 *
 *   Vercel (src/data/{name}.json is never deployed, see .vercelignore):
 *     readJson  - falls back to src/data/seeds/{name}.json automatically
 *     writeJson - throws a clear error (Vercel filesystem is read-only)
 *
 * The two environments are completely isolated:
 *   - Local data files never reach Vercel.
 *   - Vercel only ever reads from seeds, which are promoted intentionally
 *     by the admin running: npm run data:publish
 *
 * Rules:
 * - Only import this module in API route handlers (src/app/api).
 * - Never import this module in Client Components or Server Components.
 * - All callers must await readJson, writeJson, and updateJson.
 */

import fs from "fs/promises";
import path from "path";
import os from "os";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const SEEDS_DIR = path.join(DATA_DIR, "seeds");

/** True when running inside a Vercel deployment. */
const IS_VERCEL = Boolean(process.env.VERCEL);

/**
 * Resolve the absolute path for a named data file.
 * Filename must be a bare name like "teams" or "teams.json".
 */
function resolvePath(name: string): string {
  const base = name.endsWith(".json") ? name : `${name}.json`;
  return path.join(DATA_DIR, base);
}

/**
 * Read a JSON data file and return its parsed content.
 *
 * Resolution order:
 *   1. src/data/{name}.json        (live file, local only)
 *   2. src/data/seeds/{name}.json  (seed file, deployed to Vercel)
 *   3. fallback value              (if neither file exists)
 */
export async function readJson<T>(name: string, fallback: T): Promise<T> {
  const livePath = resolvePath(name);
  const seedPath = path.join(SEEDS_DIR, name.endsWith(".json") ? name : `${name}.json`);

  for (const filePath of [livePath, seedPath]) {
    try {
      const raw = await fs.readFile(/*turbopackIgnore: true*/ filePath, "utf-8");
      return JSON.parse(raw) as T;
    } catch (err: unknown) {
      if (isNodeError(err) && err.code === "ENOENT") {
        continue;
      }
      throw new Error(
        `Failed to read data file "${name}" at ${filePath}: ${String(err)}`
      );
    }
  }

  return fallback;
}

/**
 * Write data to a JSON data file using an atomic write-then-rename.
 * The existing file is never touched until the new content is fully written.
 *
 * Throws immediately on Vercel because the project filesystem is read-only.
 * All write operations must be performed locally by an authenticated admin.
 */
export async function writeJson<T>(name: string, data: T): Promise<void> {
  if (IS_VERCEL) {
    throw new Error(
      `Write operations are not permitted on Vercel. ` +
      `Update "${name}" locally, then run npm run data:publish to promote it to production.`
    );
  }

  const filePath = resolvePath(name);
  const dir = path.dirname(filePath);
  const tmpPath = path.join(
    os.tmpdir(),
    `rpl-${name}-${Date.now()}.json.tmp`
  );

  const content = JSON.stringify(data, null, 2);

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(tmpPath, content, "utf-8");
    await fs.rename(tmpPath, filePath);
  } catch (err: unknown) {
    try {
      await fs.unlink(tmpPath);
    } catch {
      // Temp file may not exist if writeFile failed; ignore.
    }
    throw new Error(
      `Failed to write data file "${name}": ${String(err)}`
    );
  }
}

/**
 * Read a JSON file, apply a transform function, and write the result back.
 * The read and write are not locked against concurrent requests.
 * For this project's single-server, low-concurrency use case this is acceptable.
 */
export async function updateJson<T>(
  name: string,
  fallback: T,
  transform: (current: T) => T
): Promise<T> {
  const current = await readJson<T>(name, fallback);
  const updated = transform(current);
  await writeJson(name, updated);
  return updated;
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}
