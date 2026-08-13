import { z } from "zod";
import { RELEASE_2026_08_13_1 } from "@/catalog/releases/2026.08.13-1";
import {
  assetSourceSchema,
  fireplaceProductSchema,
  mantelFinishSchema,
  mantelProductSchema,
  stoneProductSchema,
  type FaceOptionId,
  type FirebackOptionId,
  type FireplaceId,
  type FireplaceProduct,
  type MantelFinishId,
  type MantelProduct,
  type MantelProductId,
  type MantelWidth,
  type StoneId,
  type StoneProduct,
} from "@/domain/catalog";

const brandSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  productKinds: z.array(z.enum(["appliance", "stone", "mantel"])).min(1),
  sourceUrl: z.string().url(),
});

export const catalogReleaseSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
    version: z.string().regex(/^\d{4}\.\d{2}\.\d{2}-\d+$/),
    effectiveAt: z.string().datetime(),
    status: z.literal("approved"),
    brands: z.array(brandSchema).min(1),
    fireplaces: z.array(fireplaceProductSchema),
    mantelProducts: z.array(mantelProductSchema),
    mantelFinishes: z.array(mantelFinishSchema),
    stones: z.array(stoneProductSchema),
  })
  .superRefine((release, context) => {
    const unique = (values: string[], path: (string | number)[], label: string) => {
      const seen = new Set<string>();
      values.forEach((value, index) => {
        if (seen.has(value)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate ${label}: ${value}`,
            path: [...path, index],
          });
        }
        seen.add(value);
      });
    };
    unique(
      release.brands.map((brand) => brand.id),
      ["brands"],
      "brand ID",
    );
    unique(
      release.fireplaces.map((product) => product.id),
      ["fireplaces"],
      "fireplace ID",
    );
    unique(
      release.fireplaces.map((product) => product.sku),
      ["fireplaces"],
      "fireplace SKU",
    );
    unique(
      release.mantelProducts.map((product) => product.id),
      ["mantelProducts"],
      "mantel ID",
    );
    unique(
      release.mantelFinishes.map((finish) => finish.id),
      ["mantelFinishes"],
      "mantel finish ID",
    );
    unique(
      release.stones.map((stone) => stone.id),
      ["stones"],
      "stone ID",
    );
    unique(
      release.stones.flatMap((stone) => (stone.productCode ? [stone.productCode] : [])),
      ["stones"],
      "stone product code",
    );

    const brandIds = new Set(release.brands.map((brand) => brand.id));
    const mantelIds = new Set(release.mantelProducts.map((product) => product.id));
    const finishIds = new Set(release.mantelFinishes.map((finish) => finish.id));
    const finishesById = new Map(release.mantelFinishes.map((finish) => [finish.id, finish]));
    const mantelsById = new Map(release.mantelProducts.map((product) => [product.id, product]));
    for (const [index, product] of release.fireplaces.entries()) {
      if (!brandIds.has(product.brandId)) {
        context.addIssue({
          code: "custom",
          message: `Unknown fireplace brand: ${product.brandId}`,
          path: ["fireplaces", index, "brandId"],
        });
      }
      if (!product.faceOptions.some((face) => face.id === product.defaultFaceOptionId)) {
        context.addIssue({
          code: "custom",
          message: `Default face is not offered by ${product.id}`,
          path: ["fireplaces", index, "defaultFaceOptionId"],
        });
      }
      if (
        !product.firebackOptions.some(
          (fireback) => fireback.id === product.defaultFirebackOptionId,
        )
      ) {
        context.addIssue({
          code: "custom",
          message: `Default fireback is not offered by ${product.id}`,
          path: ["fireplaces", index, "defaultFirebackOptionId"],
        });
      }
      unique(
        product.faceOptions.map((face) => face.id),
        ["fireplaces", index, "faceOptions"],
        `${product.id} face ID`,
      );
      unique(
        product.firebackOptions.map((fireback) => fireback.id),
        ["fireplaces", index, "firebackOptions"],
        `${product.id} fireback ID`,
      );
      for (const compatibleId of product.burnMedia?.compatibleFirebackIds ?? []) {
        if (!product.firebackOptions.some((fireback) => fireback.id === compatibleId)) {
          context.addIssue({
            code: "custom",
            message: `Burn media references unavailable fireback ${compatibleId}`,
            path: ["fireplaces", index, "burnMedia", "compatibleFirebackIds"],
          });
        }
      }
    }
    for (const [index, product] of release.mantelProducts.entries()) {
      if (!brandIds.has(product.brandId)) {
        context.addIssue({
          code: "custom",
          message: `Unknown mantel brand: ${product.brandId}`,
          path: ["mantelProducts", index, "brandId"],
        });
      }
      if (!finishIds.has(product.defaultFinishId)) {
        context.addIssue({
          code: "custom",
          message: `Unknown default finish: ${product.defaultFinishId}`,
          path: ["mantelProducts", index, "defaultFinishId"],
        });
      } else if (!product.finishIds.includes(product.defaultFinishId)) {
        context.addIssue({
          code: "custom",
          message: `Default finish is not offered by ${product.id}`,
          path: ["mantelProducts", index, "defaultFinishId"],
        });
      }
      unique(
        product.sizes.map((size) => String(size.width)),
        ["mantelProducts", index, "sizes"],
        `${product.id} mantel width`,
      );
      for (const finishId of product.finishIds) {
        if (!finishIds.has(finishId)) {
          context.addIssue({
            code: "custom",
            message: `Unknown offered finish: ${finishId}`,
            path: ["mantelProducts", index, "finishIds"],
          });
        } else if (!finishesById.get(finishId)?.compatibleProductIds.includes(product.id)) {
          context.addIssue({
            code: "custom",
            message: `Finish ${finishId} does not reference offered mantel ${product.id}`,
            path: ["mantelProducts", index, "finishIds"],
          });
        }
      }
    }
    for (const [index, finish] of release.mantelFinishes.entries()) {
      for (const productId of finish.compatibleProductIds) {
        if (!mantelIds.has(productId)) {
          context.addIssue({
            code: "custom",
            message: `Unknown compatible mantel: ${productId}`,
            path: ["mantelFinishes", index, "compatibleProductIds"],
          });
        } else if (!mantelsById.get(productId)?.finishIds.includes(finish.id)) {
          context.addIssue({
            code: "custom",
            message: `Mantel ${productId} does not offer compatible finish ${finish.id}`,
            path: ["mantelFinishes", index, "compatibleProductIds"],
          });
        }
      }
    }
    for (const [index, stone] of release.stones.entries()) {
      if (!brandIds.has(stone.brandId)) {
        context.addIssue({
          code: "custom",
          message: `Unknown stone brand: ${stone.brandId}`,
          path: ["stones", index, "brandId"],
        });
      }
    }
  });

export type CatalogRelease = z.infer<typeof catalogReleaseSchema>;
export type CatalogBrand = z.infer<typeof brandSchema>;

export const APPROVED_CATALOG_RELEASE = catalogReleaseSchema.parse(RELEASE_2026_08_13_1);

export interface CatalogRepository {
  readonly release: CatalogRelease;
  listBrands(): readonly CatalogBrand[];
  listFireplaces(): readonly FireplaceProduct[];
  listMantels(): readonly MantelProduct[];
  listMantelFinishes(): Readonly<CatalogRelease["mantelFinishes"]>;
  listStones(): readonly StoneProduct[];
  hasFireplace(id: string): id is FireplaceId;
  hasMantel(id: string): id is MantelProductId;
  hasMantelFinish(id: string): id is MantelFinishId;
  hasStone(id: string): id is StoneId;
  getFireplace(id: FireplaceId): FireplaceProduct;
  getFace(
    fireplaceId: FireplaceId,
    faceId: FaceOptionId,
  ): FireplaceProduct["faceOptions"][number];
  getFireback(
    fireplaceId: FireplaceId,
    firebackId: FirebackOptionId,
  ): FireplaceProduct["firebackOptions"][number];
  getMantel(id: MantelProductId): MantelProduct;
  getMantelSize(productId: MantelProductId, width: MantelWidth): MantelProduct["sizes"][number];
  getMantelFinish(
    productId: MantelProductId,
    finishId: MantelFinishId,
  ): CatalogRelease["mantelFinishes"][number];
  getStone(id: StoneId): StoneProduct;
  getCoreAssetPaths(): readonly string[];
  getFireplaceAssetPaths(id: FireplaceId): readonly string[];
  getStoneAssetPaths(id: StoneId): readonly string[];
  getMantelFinishAssetPaths(id: MantelFinishId): readonly string[];
  getDesignAssetPaths(selection: DesignAssetSelection): readonly string[];
  getAssetPaths(): readonly string[];
}

export type DesignAssetSelection = {
  fireplaceId: FireplaceId;
  stoneId: StoneId;
  mantelFinishId: MantelFinishId;
};

export function createCatalogRepository(releaseCandidate: unknown): CatalogRepository {
  const release = catalogReleaseSchema.parse(releaseCandidate);
  const fireplacesById = new Map(release.fireplaces.map((product) => [product.id, product]));
  const mantelsById = new Map(release.mantelProducts.map((product) => [product.id, product]));
  const finishesById = new Map(release.mantelFinishes.map((finish) => [finish.id, finish]));
  const stonesById = new Map(release.stones.map((stone) => [stone.id, stone]));

  const uniqueAssetPaths = (assets: z.infer<typeof assetSourceSchema>[]) => [
    ...new Set(assets.map((asset) => asset.localPath)),
  ];
  // Keep the always-loaded pack intentionally small. Manufacturer expansion
  // must not decode every stone and mantel texture into GPU memory at startup.
  const coreAssetPaths: string[] = [];
  const fireplaceAssetPaths = new Map(
    release.fireplaces.map((product) => [
      product.id,
      uniqueAssetPaths([
        ...product.faceOptions.flatMap((face) => [
          face.asset,
          face.overlayAsset,
          face.maskAsset,
        ]),
        ...product.firebackOptions.map((fireback) => fireback.asset),
        ...(product.burnMedia ? [product.burnMedia.video, product.burnMedia.poster] : []),
      ]),
    ]),
  );
  const stoneAssetPaths = new Map(
    release.stones.map((stone) => [
      stone.id,
      uniqueAssetPaths([...stone.assets, ...stone.hearthstone.assets]),
    ]),
  );
  const stoneThumbnailPaths = release.stones.map((stone) => stone.thumbnailAsset.localPath);
  const mantelFinishAssetPaths = new Map(
    release.mantelFinishes.map((finish) => [finish.id, uniqueAssetPaths(finish.assets)]),
  );

  const requireRecord = <T>(record: T | undefined, label: string): T => {
    if (!record) throw new Error(`Unknown approved ${label}.`);
    return record;
  };

  return {
    release,
    listBrands: () => release.brands,
    listFireplaces: () => release.fireplaces,
    listMantels: () => release.mantelProducts,
    listMantelFinishes: () => release.mantelFinishes,
    listStones: () => release.stones,
    hasFireplace: (id): id is FireplaceId => fireplacesById.has(id),
    hasMantel: (id): id is MantelProductId => mantelsById.has(id),
    hasMantelFinish: (id): id is MantelFinishId => finishesById.has(id),
    hasStone: (id): id is StoneId => stonesById.has(id),
    getFireplace: (id) => requireRecord(fireplacesById.get(id), `fireplace: ${id}`),
    getFace: (fireplaceId, faceId) => {
      const product = requireRecord(
        fireplacesById.get(fireplaceId),
        `fireplace: ${fireplaceId}`,
      );
      return requireRecord(
        product.faceOptions.find((face) => face.id === faceId) ??
          product.faceOptions.find((face) => face.id === product.defaultFaceOptionId),
        `face ${faceId} for ${fireplaceId}`,
      );
    },
    getFireback: (fireplaceId, firebackId) => {
      const product = requireRecord(
        fireplacesById.get(fireplaceId),
        `fireplace: ${fireplaceId}`,
      );
      return requireRecord(
        product.firebackOptions.find((fireback) => fireback.id === firebackId) ??
          product.firebackOptions.find(
            (fireback) => fireback.id === product.defaultFirebackOptionId,
          ),
        `fireback ${firebackId} for ${fireplaceId}`,
      );
    },
    getMantel: (id) => requireRecord(mantelsById.get(id), `mantel: ${id}`),
    getMantelSize: (productId, width) => {
      const product = requireRecord(mantelsById.get(productId), `mantel: ${productId}`);
      return requireRecord(
        product.sizes.find((size) => size.width === width),
        `${width}-inch size for mantel ${productId}`,
      );
    },
    getMantelFinish: (productId, finishId) => {
      const finish = finishesById.get(finishId);
      if (!finish || !finish.compatibleProductIds.includes(productId)) {
        throw new Error(`Mantel finish ${finishId} is not approved for ${productId}.`);
      }
      return finish;
    },
    getStone: (id) => requireRecord(stonesById.get(id), `stone: ${id}`),
    getCoreAssetPaths: () => coreAssetPaths,
    getFireplaceAssetPaths: (id) =>
      requireRecord(fireplaceAssetPaths.get(id), `fireplace asset pack: ${id}`),
    getStoneAssetPaths: (id) =>
      requireRecord(stoneAssetPaths.get(id), `stone asset pack: ${id}`),
    getMantelFinishAssetPaths: (id) =>
      requireRecord(mantelFinishAssetPaths.get(id), `mantel finish asset pack: ${id}`),
    getDesignAssetPaths: ({ fireplaceId, stoneId, mantelFinishId }) => [
      ...new Set([
        ...coreAssetPaths,
        ...requireRecord(
          fireplaceAssetPaths.get(fireplaceId),
          `fireplace asset pack: ${fireplaceId}`,
        ),
        ...requireRecord(stoneAssetPaths.get(stoneId), `stone asset pack: ${stoneId}`),
        ...requireRecord(
          mantelFinishAssetPaths.get(mantelFinishId),
          `mantel finish asset pack: ${mantelFinishId}`,
        ),
      ]),
    ],
    getAssetPaths: () => [
      ...new Set([
        ...coreAssetPaths,
        ...[...fireplaceAssetPaths.values()].flat(),
        ...[...stoneAssetPaths.values()].flat(),
        ...stoneThumbnailPaths,
        ...[...mantelFinishAssetPaths.values()].flat(),
      ]),
    ],
  };
}

export const catalogRepository = createCatalogRepository(APPROVED_CATALOG_RELEASE);
export const APPROVED_CORE_ASSET_PATHS = catalogRepository.getCoreAssetPaths();
export const APPROVED_ASSET_PATHS = catalogRepository.getAssetPaths();
export const getApprovedFireplaceAssetPaths = (id: FireplaceId) =>
  catalogRepository.getFireplaceAssetPaths(id);
export const getApprovedStoneAssetPaths = (id: StoneId) =>
  catalogRepository.getStoneAssetPaths(id);
export const getApprovedMantelFinishAssetPaths = (id: MantelFinishId) =>
  catalogRepository.getMantelFinishAssetPaths(id);
export const getApprovedDesignAssetPaths = (selection: DesignAssetSelection) =>
  catalogRepository.getDesignAssetPaths(selection);
