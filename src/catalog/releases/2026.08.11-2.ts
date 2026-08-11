import {
  fireplaceProducts,
  mantelFinishes,
  mantelProducts,
  stoneProducts,
} from "@/domain/catalog";

/** Approved showroom snapshot with exact FPX FireBuilder fireback configurations. */
export const RELEASE_2026_08_11_2 = {
  schemaVersion: 1,
  id: "firedesign-2026.08.11-2",
  version: "2026.08.11-2",
  effectiveAt: "2026-08-11T19:30:00.000Z",
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
