import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const assetsDirectory = path.join(root, "public", "assets");
const manifestPath = path.join(assetsDirectory, "manifest.json");

const entries = await readdir(assetsDirectory);
const files = [];

for (const name of entries.toSorted()) {
  if (name === "manifest.json") continue;
  const filePath = path.join(assetsDirectory, name);
  const fileStats = await stat(filePath);
  if (!fileStats.isFile()) continue;
  const bytes = await readFile(filePath);
  files.push({
    path: `/assets/${name}`,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.byteLength,
  });
}

const manifest = {
  version: "2026.08.04-1",
  generatedAt: "2026-08-04T00:00:00.000Z",
  files,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${files.length} asset checksums to ${path.relative(root, manifestPath)}.`);
