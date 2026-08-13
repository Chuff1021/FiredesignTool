import {
  fireplaceProducts,
  mantelFinishes,
  mantelProducts,
  stoneProducts,
} from "@/domain/catalog";

/** Approved showroom snapshot with color-accurate, course-registered Centurion atlases. */
export const RELEASE_2026_08_13_3 = {
  schemaVersion: 1,
  id: "firedesign-2026.08.13-3",
  version: "2026.08.13-3",
  effectiveAt: "2026-08-13T21:46:00.000Z",
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
