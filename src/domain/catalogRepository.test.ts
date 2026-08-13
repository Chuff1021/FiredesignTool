import { describe, expect, it } from "vitest";
import {
  APPROVED_ASSET_PATHS,
  APPROVED_CATALOG_RELEASE,
  APPROVED_CORE_ASSET_PATHS,
  catalogReleaseSchema,
  catalogRepository,
  createCatalogRepository,
} from "@/domain/catalogRepository";

describe("versioned catalog repository", () => {
  it("indexes the complete approved release behind stable repository methods", () => {
    expect(catalogRepository.release.version).toBe("2026.08.13-1");
    expect(catalogRepository.listBrands().map((brand) => brand.id)).toEqual([
      "fireplace-xtrordinair",
      "centurion-stone",
      "pearl-mantels",
    ]);
    expect(catalogRepository.getFireplace("864-trv-31k-clean-face").sku).toBe("98500187");
    expect(catalogRepository.getFace("864-trv-31k-deluxe", "classic-arch").sku).toBe(
      "99300497",
    );
    expect(catalogRepository.getFireback("864-trv-31k-deluxe", "ledgestone").sku).toBe(
      "96100841",
    );
    expect(catalogRepository.getMantelSize("linear", 84).modelCode).toBe("NCL-84");
    expect(catalogRepository.getStone("kentucky-ledge").productCode).toBe("150-260-15");
    expect(APPROVED_ASSET_PATHS).toHaveLength(672);
    expect(new Set(APPROVED_ASSET_PATHS).size).toBe(APPROVED_ASSET_PATHS.length);
  });

  it("partitions exact fireplace and material selections into deterministic design packs", () => {
    const fireplaceIds = catalogRepository.listFireplaces().map((product) => product.id);
    const allPackedAssets = new Set(APPROVED_CORE_ASSET_PATHS);
    for (const id of fireplaceIds) {
      const pack = catalogRepository.getFireplaceAssetPaths(id);
      expect(pack.length).toBeGreaterThan(0);
      expect(pack.every((path) => path.startsWith("/assets/"))).toBe(true);
      pack.forEach((path) => allPackedAssets.add(path));
    }
    for (const stone of catalogRepository.listStones()) {
      catalogRepository
        .getStoneAssetPaths(stone.id)
        .forEach((path) => allPackedAssets.add(path));
      expect(APPROVED_ASSET_PATHS).toContain(stone.thumbnailAsset.localPath);
    }
    for (const finish of catalogRepository.listMantelFinishes()) {
      catalogRepository
        .getMantelFinishAssetPaths(finish.id)
        .forEach((path) => allPackedAssets.add(path));
    }
    expect([...allPackedAssets].every((path) => APPROVED_ASSET_PATHS.includes(path))).toBe(
      true,
    );
    expect(
      catalogRepository.getDesignAssetPaths({
        fireplaceId: "864-trv-31k-clean-face",
        stoneId: "kentucky-ledge",
        mantelFinishId: "graywash",
      }).length,
    ).toBeLessThan(APPROVED_ASSET_PATHS.length);
  });

  it("accepts a new manufacturer and appliance without changing TypeScript enums", () => {
    const candidate = structuredClone(APPROVED_CATALOG_RELEASE);
    candidate.id = "firedesign-catalog-expansion-test";
    candidate.brands.push({
      id: "superior",
      name: "Superior",
      productKinds: ["appliance"],
      sourceUrl: "https://superiorfireplaces.us.com/",
    });
    candidate.fireplaces.push({
      ...candidate.fireplaces[0]!,
      id: "superior-drc3045-test",
      brandId: "superior",
      manufacturer: "Superior",
      model: "DRC3045 Test Fixture",
      shortLabel: "DRC3045 Test",
      sku: "SUPERIOR-TEST-001",
    });
    const repository = createCatalogRepository(candidate);
    expect(repository.getFireplace("superior-drc3045-test")).toMatchObject({
      manufacturer: "Superior",
      applianceType: "fireplace",
      fuel: "gas",
    });
  });

  it("rejects duplicate IDs, unknown brands, and broken option references", () => {
    const duplicate = structuredClone(APPROVED_CATALOG_RELEASE);
    duplicate.fireplaces.push({ ...duplicate.fireplaces[0]! });
    expect(() => catalogReleaseSchema.parse(duplicate)).toThrow(/Duplicate fireplace ID/);

    const unknownBrand = structuredClone(APPROVED_CATALOG_RELEASE);
    unknownBrand.fireplaces[0]!.brandId = "unregistered-brand";
    expect(() => catalogReleaseSchema.parse(unknownBrand)).toThrow(/Unknown fireplace brand/);

    const brokenDefault = structuredClone(APPROVED_CATALOG_RELEASE);
    brokenDefault.fireplaces[0]!.defaultFaceOptionId = "missing-face";
    expect(() => catalogReleaseSchema.parse(brokenDefault)).toThrow(
      /Default face is not offered/,
    );

    const brokenFinish = structuredClone(APPROVED_CATALOG_RELEASE);
    brokenFinish.mantelFinishes[0]!.compatibleProductIds = ["missing-mantel"];
    expect(() => catalogReleaseSchema.parse(brokenFinish)).toThrow(/Unknown compatible mantel/);
  });
});
