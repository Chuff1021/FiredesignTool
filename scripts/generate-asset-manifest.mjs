import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const assetsDirectory = path.join(root, "public", "assets");
const manifestPath = path.join(assetsDirectory, "manifest.json");

const files = [];

async function collectFiles(directory) {
  for (const name of (await readdir(directory)).toSorted()) {
    const filePath = path.join(directory, name);
    if (filePath === manifestPath) continue;
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) {
      await collectFiles(filePath);
      continue;
    }
    if (!fileStats.isFile()) continue;
    const bytes = await readFile(filePath);
    const relativePath = path.relative(assetsDirectory, filePath).split(path.sep).join("/");
    files.push({
      path: `/assets/${relativePath}`,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      size: bytes.byteLength,
    });
  }
}

await collectFiles(assetsDirectory);

const manifest = {
  version: "2026.08.11-2",
  generatedAt: "2026-08-11T00:00:00.000Z",
  files,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${files.length} asset checksums to ${path.relative(root, manifestPath)}.`);
