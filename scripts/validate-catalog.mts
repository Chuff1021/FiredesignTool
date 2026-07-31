import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { FPX_CURRENT_INTAKE, summarizeCatalogIntake } from "../src/catalog/intake";
import { APPROVED_ASSET_PATHS, catalogRepository } from "../src/domain/catalogRepository";

type ManifestEntry = { path: string; size: number; sha256: string };
type AssetManifest = { version: string; generatedAt: string; files: ManifestEntry[] };

const projectRoot = process.cwd();
const manifestPath = path.join(projectRoot, "public/assets/manifest.json");
const manifestDocument = JSON.parse(await readFile(manifestPath, "utf8")) as AssetManifest;
const manifest = manifestDocument.files;
const manifestByPath = new Map(manifest.map((entry) => [entry.path, entry]));
const failures: string[] = [];

for (const assetPath of APPROVED_ASSET_PATHS) {
  const manifestEntry = manifestByPath.get(assetPath);
  if (!manifestEntry) {
    failures.push(`Missing manifest entry: ${assetPath}`);
    continue;
  }
  const filePath = path.join(projectRoot, "public", assetPath.replace(/^\//, ""));
  try {
    const [file, fileStats] = await Promise.all([readFile(filePath), stat(filePath)]);
    const checksum = createHash("sha256").update(file).digest("hex");
    if (fileStats.size !== manifestEntry.size) {
      failures.push(`Size mismatch: ${assetPath}`);
    }
    if (checksum !== manifestEntry.sha256) {
      failures.push(`Checksum mismatch: ${assetPath}`);
    }
  } catch {
    failures.push(`Missing packaged asset: ${assetPath}`);
  }
}

for (const entry of manifest) {
  if (!APPROVED_ASSET_PATHS.includes(entry.path)) {
    failures.push(`Manifest contains an unreferenced asset: ${entry.path}`);
  }
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR ${failure}`));
  process.exitCode = 1;
} else {
  const intake = summarizeCatalogIntake(FPX_CURRENT_INTAKE);
  console.log(`Catalog release: ${catalogRepository.release.version}`);
  console.log(`Asset manifest release: ${manifestDocument.version}`);
  console.log(`Approved products: ${catalogRepository.listFireplaces().length}`);
  console.log(`FPX indexed families: ${intake.totalFamilies}`);
  console.log(`FPX families awaiting approval: ${intake.remainingFamilies}`);
  console.log(`FPX document-verified families: ${intake.byStage["documents-verified"]}`);
  console.log(`Packaged assets verified: ${APPROVED_ASSET_PATHS.length}`);
}
