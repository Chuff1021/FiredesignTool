import { catalogIntakeSchema, type CatalogIntakeProduct } from "@/catalog/intakeSchema";

const checkedAt = "2026-07-31";
const gasIndex = "https://www.majesticproducts.com/fireplaces/gas";
const insertIndex = "https://www.majesticproducts.com/fireplaces/gas-inserts";

function product(
  id: string,
  model: string,
  style: CatalogIntakeProduct["style"],
  productUrl = gasIndex,
  applianceType: CatalogIntakeProduct["applianceType"] = "fireplace",
  venting: CatalogIntakeProduct["venting"] = "unknown",
): CatalogIntakeProduct {
  return {
    id,
    brandId: "majestic",
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
      "Current official family is indexed; model variants, SKUs, manual revision, options, asset authority, and production visual masters remain gated.",
  };
}

export const MAJESTIC_CURRENT_INTAKE = catalogIntakeSchema.parse({
  schemaVersion: 2,
  snapshotId: "majestic-2026.07.31-1",
  brandId: "majestic",
  brandName: "Majestic",
  manufacturer: "Hearth & Home Technologies",
  sourceCheckedAt: checkedAt,
  sourceUrls: [
    "https://www.majesticproducts.com/browse",
    "https://www.majesticproducts.com/fireplaces",
    gasIndex,
    insertIndex,
  ],
  products: [
    product(
      "jasper-series",
      "Jasper Series",
      "traditional",
      "https://www.majesticproducts.com/fireplaces/gas-inserts/jasper-series-direct-vent-gas-insert",
      "insert",
      "direct-vent",
    ),
    product("ruby-series", "Ruby Series", "traditional", insertIndex, "insert"),
    product("trilliant-series", "Trilliant Series", "traditional", insertIndex, "insert"),
    product(
      "ruby-platinum",
      "Ruby Platinum",
      "traditional",
      "https://www.majesticproducts.com/fireplaces/gas-inserts/ruby-platinum",
      "insert",
      "direct-vent",
    ),
    product("mercury", "Mercury", "traditional"),
    product("quartz-series", "Quartz Series", "traditional"),
    product("reveal", "Reveal", "traditional"),
    product("jade-series", "Jade Series", "linear"),
    product("meridian-series", "Meridian / Meridian Platinum", "traditional"),
    product("meridian-modern", "Meridian Modern", "linear"),
    product("echelon-ii", "Echelon II", "linear"),
    product("corner", "Corner", "see-through"),
    product("pier", "Pier", "see-through"),
    product("echelon-ii-see-through", "Echelon II See-Through", "see-through"),
    product("marquis-ii", "Marquis II", "traditional"),
    product("twilight", "Twilight", "see-through"),
    product("twilight-modern", "Twilight Modern", "see-through"),
    product("fortress", "Fortress", "see-through"),
    product("marquis-ii-see-through", "Marquis II See-Through", "see-through"),
  ],
});
