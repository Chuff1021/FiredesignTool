import {
  fireplaceProducts,
  mantelFinishes,
  mantelProducts,
  stoneProducts,
} from "@/domain/catalog";

/** Approved showroom snapshot covering current FPX gas and wood fireplace lineups. */
export const RELEASE_2026_08_05_1 = {
  schemaVersion: 1,
  id: "firedesign-2026.08.05-1",
  version: "2026.08.05-1",
  effectiveAt: "2026-08-05T18:30:00.000Z",
  status: "approved",
  brands: [
    {
      id: "fireplace-xtrordinair",
      name: "Fireplace Xtrordinair",
      productKinds: ["appliance"],
      sourceUrl: "https://www.fireplacex.com/",
    },
    {
      id: "centurion-stone",
      name: "Centurion Stone",
      productKinds: ["stone"],
      sourceUrl: "https://www.centurionstone.com/",
    },
    {
      id: "pearl-mantels",
      name: "Pearl Mantels",
      productKinds: ["mantel"],
      sourceUrl: "https://www.pearlmantels.com/",
    },
  ],
  fireplaces: fireplaceProducts,
  mantelProducts,
  mantelFinishes,
  stones: stoneProducts,
} as const;
