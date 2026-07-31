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
    {
      ...product(
        "ruby-platinum",
        "Ruby Platinum",
        "traditional",
        "https://www.majesticproducts.com/fireplaces/gas-inserts/ruby-platinum",
        "insert",
        "direct-vent",
      ),
      stage: "documents-verified",
      evidence: {
        productIdentifiers: [
          { id: "RUBYP30IN", kind: "model" },
          { id: "RUBYP30IN-BIR", kind: "model" },
          { id: "RUBYP30IL", kind: "model" },
          { id: "RUBYP35IN", kind: "model" },
          { id: "RUBYP35IN-BIR", kind: "model" },
          { id: "RUBYP35IL", kind: "model" },
        ],
        variants: [
          {
            id: "Ruby Platinum 30",
            viewingArea: { width: 27.5, height: 15.9375 },
            minimumOpening: {
              frontWidth: 31.625,
              height: 21,
              rearWidth: 20.125,
              depth: 15,
            },
          },
          {
            id: "Ruby Platinum 35",
            viewingArea: { width: 32.5, height: 19.375 },
            minimumOpening: {
              frontWidth: 36.625,
              height: 24.25,
              rearWidth: 25.125,
              depth: 15,
            },
          },
        ],
        installationManualUrl:
          "https://downloads.hearthnhome.com/installmanuals/2722_980_RUBYP30I_INSTALL.pdf",
        installationManualRevision: "2722-980 Rev. C 3/26",
        dimensionPages: [9, 10, 11, 12, 14],
        clearanceRulePages: [17, 18],
        clearanceRules: {
          mantel: {
            measurementFrom: "top-of-surround-opening",
            profiles: [
              {
                material: "combustible",
                points: [{ projection: 12, minimumClearance: 12 }],
              },
              {
                material: "non-combustible",
                points: [
                  { projection: 6, minimumClearance: 6 },
                  { projection: 12, minimumClearance: 12 },
                ],
              },
            ],
          },
          hearth: {
            measurementFrom: "appliance-base",
            minimumFrontGap: 0.5,
            minimumApplianceFloorGap: 0.25,
            mustRemainBelowSurround: true,
          },
        },
        optionPages: [10, 11, 12, 17],
        visualOptionIds: [
          "Cottage Red",
          "Reflective Black Glass",
          "Tavern Brown",
          "Clean Screen",
          "Contemporary Arched Front",
          "Inside Fit",
          "Natural Birch logs",
          "MI30-4027",
          "MI30-4230",
          "MI30-4230D-BK",
          "MI30-4432",
          "MI35-4229",
          "MI35-4432",
          "MI35-4432D-BK",
          "MI35-4832",
        ],
        visualSourceUrls: [
          "https://hearthnhome.getbynder.com/transform/c6e9e2f4-243a-4fc9-bec6-429740a5d766/MAJ_RubyPlatinum_30_CottageRed_Oak_BlkContArch_SmSurr_so",
          "https://hearthnhome.getbynder.com/transform/0618ccec-3eb6-4437-8884-0536f0585a4b/MAJ_RubyPlat_35_CottRed_Oak_CleanScrn_Rm",
          "https://hearthnhome.getbynder.com/transform/2dc1e8db-6c2b-4d64-a6cd-1062cbdf7c1c/MAJ_RubyPlat_35_BlkGls_Birch_ContempArch_Rm",
          "https://hearthnhome.getbynder.com/m/79b5f0dc5c300098/original/MAJ_Ruby_Platinum_product_intro_F_720p.mp4",
        ],
        maximumOfficialLayerPixels: 2000,
        assetQualityGate: "blocked-high-resolution-master",
      },
      notes:
        "Current 30- and 35-inch model identifiers, viewing areas, standard-surround masonry openings, front dimensions, surround IDs, and clearance measurement origin are verified against manual 2722-980 Rev. C. Mantel clearance is measured from the top of the surround opening. Official isolated imagery reaches 2000 px and remains blocked from the 4K approved catalog.",
    },
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
