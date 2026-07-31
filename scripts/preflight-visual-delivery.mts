import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import {
  visualDeliveryManifestSchema,
  type VisualDeliveryAsset,
  type VisualRasterDeliveryAsset,
} from "../src/catalog/visualDelivery";

type RasterMetadata = {
  format: string | null;
  width: number | null;
  height: number | null;
  colorSpace: string | null;
  hasAlpha: boolean;
  hasEmbeddedIcc: boolean;
  transparentBackgroundPercent: number | null;
  openingTransparentPercent: number | null;
};

type AssetPreflightResult = {
  id: string;
  file: string;
  kind: VisualDeliveryAsset["kind"];
  bytes: number | null;
  computedSha256: string | null;
  raster: RasterMetadata | null;
  automatedChecksPassed: boolean;
  errors: string[];
  manualReview: string[];
};

type PackageFileInspection = {
  filePath: string | null;
  bytes: number | null;
  computedSha256: string | null;
  errors: string[];
};

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function transparentRatio(bytes: Buffer, channels: number): number {
  let transparent = 0;
  const pixels = bytes.length / channels;
  for (let offset = channels - 1; offset < bytes.length; offset += channels) {
    if (bytes[offset]! <= 12) transparent += 1;
  }
  return pixels === 0 ? 0 : transparent / pixels;
}

function percent(value: number): number {
  return Number((value * 100).toFixed(3));
}

function expectedCadExtensions(asset: Extract<VisualDeliveryAsset, { kind: "cad-bim" }>) {
  if (asset.format === "step") return new Set([".step", ".stp"]);
  if (asset.format === "iges") return new Set([".iges", ".igs"]);
  return new Set([`.${asset.format}`]);
}

function isContainedPath(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== "..";
}

async function inspectPackageFile(
  packageRoot: string,
  relativeFile: string,
  expectedSha256: string,
): Promise<PackageFileInspection> {
  const errors: string[] = [];
  let filePath: string | null = null;
  let bytes: number | null = null;
  let computedSha256: string | null = null;
  try {
    const unresolvedPath = path.resolve(packageRoot, relativeFile);
    if (!isContainedPath(packageRoot, unresolvedPath)) {
      throw new Error("File path resolves outside the visual delivery package");
    }
    filePath = await realpath(unresolvedPath);
    if (!isContainedPath(packageRoot, filePath)) {
      throw new Error("File symlink resolves outside the visual delivery package");
    }
    const fileStats = await stat(filePath);
    if (!fileStats.isFile() || fileStats.size <= 0) {
      throw new Error("Package entry is not a non-empty regular file");
    }
    bytes = fileStats.size;
    computedSha256 = await sha256File(filePath);
    if (computedSha256 !== expectedSha256) errors.push("SHA-256 does not match the manifest");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unknown package-file error");
  }
  return { filePath, bytes, computedSha256, errors };
}

async function inspectRaster(
  filePath: string,
  asset: VisualRasterDeliveryAsset,
  errors: string[],
): Promise<RasterMetadata> {
  const image = sharp(filePath, { failOn: "error" });
  const metadata = await image.metadata();
  const format = metadata.format ?? null;
  const width = metadata.width ?? null;
  const height = metadata.height ?? null;
  const colorSpace = metadata.space ?? null;
  const hasAlpha = Boolean(metadata.hasAlpha);
  const hasEmbeddedIcc = Boolean(metadata.icc);

  if (!format || !new Set(["png", "tiff"]).has(format)) {
    errors.push(`Raster must be lossless PNG or TIFF, received ${format ?? "unknown"}`);
  }
  if (!width || width < asset.minimumWidth) {
    errors.push(`Width ${width ?? 0}px is below ${asset.minimumWidth}px`);
  }
  if (!height || height < asset.minimumHeight) {
    errors.push(`Height ${height ?? 0}px is below ${asset.minimumHeight}px`);
  }
  if (colorSpace !== "srgb") {
    errors.push(`Decoded pixel data must be sRGB, received ${colorSpace ?? "unknown"}`);
  }
  if (asset.requireEmbeddedIcc && !hasEmbeddedIcc) {
    errors.push("The delivery manifest requires an embedded ICC profile");
  }
  if (asset.requireTransparentBackground && !hasAlpha) {
    errors.push("The production layer requires an alpha channel");
  }

  let transparentBackgroundPercent: number | null = null;
  let openingTransparentPercent: number | null = null;
  if (hasAlpha) {
    const raw = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const ratio = transparentRatio(raw.data, raw.info.channels);
    transparentBackgroundPercent = percent(ratio);
    if (asset.requireTransparentBackground && ratio < 0.01) {
      errors.push("Less than 1% of the canvas is transparent; isolation is not credible");
    }
  }

  if (asset.opening && width && height) {
    const opening = asset.opening;
    if (opening.left + opening.width > width || opening.top + opening.height > height) {
      errors.push("The calibrated firebox opening extends outside the raster canvas");
    } else {
      const openingPixels = await sharp(filePath)
        .extract({
          left: opening.left,
          top: opening.top,
          width: opening.width,
          height: opening.height,
        })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const ratio = transparentRatio(openingPixels.data, openingPixels.info.channels);
      openingTransparentPercent = percent(ratio);
      if (ratio < opening.minimumTransparentRatio) {
        errors.push(
          `Firebox opening is ${percent(ratio)}% transparent; ${percent(opening.minimumTransparentRatio)}% is required`,
        );
      }
    }
  }

  return {
    format,
    width,
    height,
    colorSpace,
    hasAlpha,
    hasEmbeddedIcc,
    transparentBackgroundPercent,
    openingTransparentPercent,
  };
}

async function inspectAsset(
  packageRoot: string,
  asset: VisualDeliveryAsset,
): Promise<AssetPreflightResult> {
  const errors: string[] = [];
  const manualReview =
    asset.kind === "raster"
      ? ["Confirm product identity, straight-on registration, sharpness, and color at 4K"]
      : [
          "Confirm customer-visible geometry, dimensions, object names, materials, and textures",
          "Convert approved visible geometry to optimized glTF before catalog promotion",
        ];
  let bytes: number | null = null;
  let computedSha256: string | null = null;
  let raster: RasterMetadata | null = null;

  const packageFile = await inspectPackageFile(packageRoot, asset.file, asset.sha256);
  bytes = packageFile.bytes;
  computedSha256 = packageFile.computedSha256;
  errors.push(...packageFile.errors);
  if (packageFile.filePath) {
    try {
      if (asset.kind === "raster") {
        if (!/\.(?:png|tiff?)$/i.test(packageFile.filePath)) {
          errors.push("Raster file extension must be .png, .tif, or .tiff");
        }
        raster = await inspectRaster(packageFile.filePath, asset, errors);
      } else if (
        !expectedCadExtensions(asset).has(path.extname(packageFile.filePath).toLowerCase())
      ) {
        errors.push(`File extension does not match declared CAD/BIM format ${asset.format}`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown asset-inspection error");
    }
  }

  return {
    id: asset.id,
    file: asset.file,
    kind: asset.kind,
    bytes,
    computedSha256,
    raster,
    automatedChecksPassed: errors.length === 0,
    errors,
    manualReview,
  };
}

const argumentsList = process.argv.slice(2);
const manifestArgument = argumentsList.find((argument) => !argument.startsWith("--"));
const reportArgument = argumentsList.find((argument) => argument.startsWith("--report="));
const reportPath = reportArgument?.slice("--report=".length);

if (!manifestArgument || argumentsList.includes("--help")) {
  console.log(`Usage: npm run assets:preflight-package -- <manifest.json> [--report=<report.json>]

Validates written usage authority, product identity, file containment, SHA-256,
raster dimensions/color/alpha/opening transparency, overlay registration, and
CAD/BIM delivery metadata. Automated preflight never replaces manual 4K,
dimensional, material, or licensing approval.`);
  process.exit(manifestArgument ? 0 : 1);
}
if (reportArgument && !reportPath) throw new Error("--report requires a file path");

const manifestPath = await realpath(path.resolve(manifestArgument));
const packageRoot = await realpath(path.dirname(manifestPath));
const manifest = visualDeliveryManifestSchema.parse(
  JSON.parse(await readFile(manifestPath, "utf8")) as unknown,
);
const permissionEvidence = await inspectPackageFile(
  packageRoot,
  manifest.permission.evidenceFile,
  manifest.permission.evidenceSha256,
);
if (
  permissionEvidence.filePath &&
  !/\.(?:eml|msg|pdf|txt)$/i.test(permissionEvidence.filePath)
) {
  permissionEvidence.errors.push("Written approval evidence must be PDF, EML, MSG, or TXT");
}
const results: AssetPreflightResult[] = [];
for (const asset of manifest.assets) results.push(await inspectAsset(packageRoot, asset));

const registrationGroups = new Map<
  string,
  {
    width: number;
    height: number;
    opening: { left: number; top: number; width: number; height: number } | null;
    assets: string[];
    errors: string[];
  }
>();
manifest.assets.forEach((asset, index) => {
  if (asset.kind !== "raster") return;
  const raster = results[index]?.raster;
  if (!raster?.width || !raster.height) return;
  const group = registrationGroups.get(asset.registrationGroup);
  if (!group) {
    registrationGroups.set(asset.registrationGroup, {
      width: raster.width,
      height: raster.height,
      opening: asset.opening
        ? {
            left: asset.opening.left,
            top: asset.opening.top,
            width: asset.opening.width,
            height: asset.opening.height,
          }
        : null,
      assets: [asset.id],
      errors: [],
    });
    return;
  }
  group.assets.push(asset.id);
  if (group.width !== raster.width || group.height !== raster.height) {
    group.errors.push(
      `${asset.id} uses ${raster.width}×${raster.height}; expected ${group.width}×${group.height}`,
    );
  }
  if (asset.opening) {
    const bounds = {
      left: asset.opening.left,
      top: asset.opening.top,
      width: asset.opening.width,
      height: asset.opening.height,
    };
    if (!group.opening) group.opening = bounds;
    else if (JSON.stringify(group.opening) !== JSON.stringify(bounds)) {
      group.errors.push(`${asset.id} uses different calibrated firebox-opening bounds`);
    }
  }
});

const groups = [...registrationGroups.entries()].map(([id, group]) => ({ id, ...group }));
const failedAssets = results.filter((result) => !result.automatedChecksPassed);
const failedGroups = groups.filter((group) => group.errors.length > 0);
const report = {
  inspectedAt: new Date().toISOString(),
  manifestPath,
  deliveryId: manifest.deliveryId,
  deliveredBy: manifest.deliveredBy,
  permission: manifest.permission,
  permissionEvidence: {
    file: manifest.permission.evidenceFile,
    bytes: permissionEvidence.bytes,
    computedSha256: permissionEvidence.computedSha256,
    automatedChecksPassed: permissionEvidence.errors.length === 0,
    errors: permissionEvidence.errors,
  },
  totals: {
    assets: results.length,
    passedAssets: results.length - failedAssets.length,
    failedAssets: failedAssets.length,
    registrationGroups: groups.length,
    failedRegistrationGroups: failedGroups.length,
  },
  automatedPreflightPassed:
    permissionEvidence.errors.length === 0 &&
    failedAssets.length === 0 &&
    failedGroups.length === 0,
  manualApprovalRequired: true,
  registrationGroups: groups,
  assets: results,
};

console.log(
  `Visual delivery ${manifest.deliveryId}: ${report.totals.passedAssets}/${report.totals.assets} assets passed; registration failures=${failedGroups.length}`,
);
permissionEvidence.errors.forEach((error) =>
  console.error(`ERROR permission evidence: ${error}`),
);
failedAssets.forEach((result) =>
  result.errors.forEach((error) => console.error(`ERROR ${result.id}: ${error}`)),
);
failedGroups.forEach((group) =>
  group.errors.forEach((error) => console.error(`ERROR registration ${group.id}: ${error}`)),
);

if (reportPath) {
  const outputPath = path.resolve(reportPath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote visual-delivery evidence to ${outputPath}`);
}

if (!report.automatedPreflightPassed) process.exitCode = 1;
