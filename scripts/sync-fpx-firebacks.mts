import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { FPX_OFFICIAL_FIREBACK_SETS } from "../src/catalog/fpxFirebacks";

const outputDirectory = path.resolve("public/assets/firebacks");
const imageRoot = "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900";

const insertFaceSkus: Readonly<Record<string, string>> = {
  "32-dvs-deluxe-ember-glo": "95300199",
  "430-deluxe-ember-glo": "96800705",
  "430-mod-fyre": "96800705",
  "34-dvl-deluxe-ember-glo": "95300596",
  "616-deluxe-ember-glo": "96900759",
  "616-mod-fyre": "96900759",
};

async function fetchOfficialPng(sourceUrl: string): Promise<Buffer> {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`${response.status} from ${sourceUrl}`);
  const contentType = response.headers.get("content-type");
  if (!contentType?.startsWith("image/png")) {
    throw new Error(`Expected PNG but received ${contentType ?? "unknown"} from ${sourceUrl}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function writeTrimmedOfficialLayer(sourceName: string, outputName: string) {
  const sourceUrl = `${imageRoot}/${sourceName}.png`;
  const source = await fetchOfficialPng(sourceUrl);
  await sharp(source)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(outputDirectory, outputName));
}

await mkdir(outputDirectory, { recursive: true });

for (const [productId, firebackSet] of Object.entries(FPX_OFFICIAL_FIREBACK_SETS)) {
  for (const fireback of firebackSet.options) {
    const sourceName = [
      firebackSet.modelSku,
      fireback.fireBuilderSku,
      ...firebackSet.defaultMediaSkus,
    ].join("_");
    await writeTrimmedOfficialLayer(sourceName, `${productId}-${fireback.id}.png`);
  }
}

for (const [productId, faceSku] of Object.entries(insertFaceSkus)) {
  await writeTrimmedOfficialLayer(faceSku, `${productId}-face-metropolitan.png`);
}

console.log(
  `Prepared ${Object.values(FPX_OFFICIAL_FIREBACK_SETS).reduce(
    (total, set) => total + set.options.length,
    0,
  )} exact FireBuilder configurations and ${Object.keys(insertFaceSkus).length} insert face layers.`,
);
