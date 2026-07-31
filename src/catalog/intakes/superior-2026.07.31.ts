import { catalogIntakeSchema, type CatalogIntakeProduct } from "@/catalog/intakeSchema";

const checkedAt = "2026-07-31";
const gasIndex = "https://superiorfireplaces.us.com/product-category/gas-fireplaces/";
const insertIndex = "https://superiorfireplaces.us.com/product-category/stoves-inserts/";

function product(
  id: string,
  model: string,
  style: CatalogIntakeProduct["style"],
  venting: CatalogIntakeProduct["venting"],
  productUrl = gasIndex,
  applianceType: CatalogIntakeProduct["applianceType"] = "fireplace",
): CatalogIntakeProduct {
  return {
    id,
    brandId: "superior-fireplaces",
    model,
    applianceType,
    fuel: "gas",
    style,
    venting,
    stage: "source-indexed",
    approvedCatalogIds: [],
    productUrl,
    officialIndexUrl: applianceType === "insert" ? insertIndex : gasIndex,
    sourceCheckedAt: checkedAt,
    notes:
      "Current official family is indexed; variant SKUs, manual revision, dimensional openings, options, asset authority, and production visual masters remain gated.",
  };
}

export const SUPERIOR_CURRENT_INTAKE = catalogIntakeSchema.parse({
  schemaVersion: 2,
  snapshotId: "superior-2026.07.31-1",
  brandId: "superior-fireplaces",
  brandName: "Superior Fireplaces",
  manufacturer: "Innovative Hearth Products",
  sourceCheckedAt: checkedAt,
  sourceUrls: [gasIndex, insertIndex, "https://superiorfireplaces.us.com/products/"],
  products: [
    product(
      "dri2000",
      "DRI2000",
      "traditional",
      "direct-vent",
      "https://superiorfireplaces.us.com/products/stoves-inserts/dri2000/",
      "insert",
    ),
    product("drt2033", "DRT2033", "traditional", "direct-vent"),
    product("drt2000", "DRT2000", "traditional", "direct-vent"),
    product("drt3000", "DRT3000", "traditional", "direct-vent"),
    product("drt3500", "DRT3500", "traditional", "direct-vent"),
    product("drt4000", "DRT4000", "traditional", "direct-vent"),
    product("drt4200", "DRT4200", "traditional", "direct-vent"),
    product("drt6300", "DRT6300", "traditional", "direct-vent"),
    product("drt35st", "DRT35ST", "see-through", "direct-vent"),
    product("drt40st", "DRT40ST", "see-through", "direct-vent"),
    product("drt63st", "DRT63ST", "see-through", "direct-vent"),
    product("drc2033", "DRC2033", "linear", "direct-vent"),
    product("drc3000", "DRC3000", "linear", "direct-vent"),
    product("drc6300", "DRC6300", "linear", "direct-vent"),
    product("drl2000", "DRL2000", "linear", "direct-vent"),
    product("drl3500", "DRL3500", "linear", "direct-vent"),
    product("drl4000", "DRL4000", "linear", "direct-vent"),
    product("drl6000", "DRL6000", "linear", "direct-vent"),
    product("vcm3026", "VCM3026", "traditional", "vent-free"),
    product("vrt-vct4000z", "VRT/VCT4000Z", "traditional", "vent-free"),
    product("vrl3000", "VRL3000", "linear", "vent-free"),
    product("vrl6000", "VRL6000", "linear", "vent-free"),
    product("vrt2500", "VRT2500", "traditional", "vent-free"),
    product("vrt3100", "VRT3100", "traditional", "vent-free"),
    product("vrt3200", "VRT3200", "traditional", "vent-free"),
    product("vrt3500", "VRT3500", "traditional", "vent-free"),
    product("vrt4500", "VRT4500", "traditional", "vent-free"),
    product("vrt6000", "VRT6000", "traditional", "vent-free"),
    product("brt4000", "BRT4000", "traditional", "b-vent"),
    product("brt40st", "BRT40ST", "see-through", "b-vent"),
  ],
});
