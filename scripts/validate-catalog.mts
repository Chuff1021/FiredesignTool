import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { summarizeIntakeRegistry } from "../src/catalog/intakeRegistry";
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
  const intake = summarizeIntakeRegistry();
  const fpx = intake.brands.find((brand) => brand.brandId === "fireplace-xtrordinair")!;
  const superior = intake.brands.find((brand) => brand.brandId === "superior-fireplaces")!;
  const majestic = intake.brands.find((brand) => brand.brandId === "majestic")!;
  console.log(`Catalog release: ${catalogRepository.release.version}`);
  console.log(`Asset manifest release: ${manifestDocument.version}`);
  console.log(`Approved products: ${catalogRepository.listFireplaces().length}`);
  console.log(`Intake brands: ${intake.brands.length}`);
  console.log(`Indexed appliance families: ${intake.totalFamilies}`);
  console.log(`FPX indexed / awaiting: ${fpx.totalFamilies} / ${fpx.remainingFamilies}`);
  console.log(`FPX document-verified families: ${fpx.byStage["documents-verified"]}`);
  console.log(
    `Superior indexed / awaiting: ${superior.totalFamilies} / ${superior.remainingFamilies}`,
  );
  console.log(`Superior document-verified families: ${superior.byStage["documents-verified"]}`);
  console.log(
    `Majestic indexed / awaiting: ${majestic.totalFamilies} / ${majestic.remainingFamilies}`,
  );
  console.log(`Majestic document-verified families: ${majestic.byStage["documents-verified"]}`);
  console.log(`Packaged assets verified: ${APPROVED_ASSET_PATHS.length}`);
}
