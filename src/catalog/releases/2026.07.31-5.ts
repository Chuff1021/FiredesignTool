import {
  fireplaceProducts,
  mantelFinishes,
  mantelProducts,
  stoneProducts,
} from "@/domain/catalog";

/**
 * Immutable input for the approved showroom catalog snapshot. A new approved
 * catalog creates a new release module; published snapshots are never edited
 * in place or assembled from live manufacturer endpoints at runtime.
 */
export const RELEASE_2026_07_31_5 = {
  schemaVersion: 1,
  id: "firedesign-2026.07.31-5",
  version: "2026.07.31-5",
  effectiveAt: "2026-07-31T00:00:00.000Z",
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
