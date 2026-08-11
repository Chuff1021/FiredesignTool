export type OfficialFirebackDefinition = {
  id: string;
  name: string;
  sku: string;
  fireBuilderSku: string;
};

export type OfficialFirebackSet = {
  modelSku: string;
  defaultMediaSkus: readonly string[];
  defaultFirebackId: string;
  display: { width: number; height: number };
  options: readonly OfficialFirebackDefinition[];
};

const option = (
  id: string,
  name: string,
  sku: string,
  fireBuilderSku = sku,
): OfficialFirebackDefinition => ({ id, name, sku, fireBuilderSku });

const firebacks564 = [
  option("common-brick", "Common Brick", "96100199", "96100199SB"),
  option("herringbone-brick", "Herringbone Brick", "96100199", "96100199HB"),
  option("handmade-brick", "Handmade Brick", "96100200"),
  option("black-handmade-brick", "Black Handmade Brick", "96100207"),
  option("tan-stacked-brick", "Tan Stacked Brick", "96100201"),
  option("old-world-stucco", "Old World Stucco", "96100202"),
  option("ledgestone", "Ledgestone", "96100198"),
  option("black-glass", "Black Glass", "96100205"),
] as const;

const firebacks864 = [
  option("herringbone-brick", "Herringbone Brick", "96100838", "96100838HB"),
  option("common-brick", "Common Brick", "96100838", "96100838SB"),
  option("handmade-brick", "Handmade Brick", "96100839"),
  option("black-handmade-brick", "Black Handmade Brick", "96100846"),
  option("black-glass", "Black Glass", "96100837"),
  option("ledgestone", "Ledgestone", "96100841"),
  option("tan-stacked-brick", "Tan Stacked Brick", "96100842", "96100842_1"),
  option("old-world-stucco", "Old World Stucco", "96100843", "96100840WS"),
] as const;

const firebacks4237 = [
  option("black-glass", "Black Glass", "96100884"),
  option("herringbone-brick", "Herringbone Brick", "96100880"),
  option("tan-stacked-brick", "Tan Stacked Brick", "96100882"),
  option("black-handmade-brick", "Black Handmade Brick", "96100885"),
  option("handmade-brick", "Handmade Brick", "96100883"),
] as const;

const insertBrickSet32 = [
  option("common-brick", "Common Brick", "96100473"),
  option("herringbone-brick", "Herringbone Brick", "96100473", "96100473HB"),
  option("handmade-brick", "Handmade Brick", "96100477"),
  option("black-handmade-brick", "Black Handmade Brick", "96100478"),
  option("ledgestone", "Ledgestone", "96100476"),
  option("greystone", "Greystone", "96100477", "96100477GS"),
  option("black-glass", "Black Glass", "96100475"),
] as const;

const insertBrickSet34 = [
  option("common-brick", "Common Brick", "96100483"),
  option("herringbone-brick", "Herringbone Brick", "96100483", "96100483HB"),
  option("handmade-brick", "Handmade Brick", "96100487"),
  option("black-handmade-brick", "Black Handmade Brick", "96100488"),
  option("ledgestone", "Ledgestone", "96100486"),
  option("black-glass", "Black Glass", "96100485"),
  option("greystone", "Greystone", "96100487", "96100487GS"),
] as const;

const insertBrickSet430 = [
  option("herringbone-brick", "Herringbone Brick", "96100917", "96100917HB"),
  option("common-brick", "Common Brick", "96100917", "96100917SB"),
  option("black-painted", "Black Painted", "96100920"),
  option("handmade-brick", "Handmade Brick", "96100921"),
  option("black-glass", "Black Glass", "96100922"),
  option("ledgestone", "Ledgestone", "96100923"),
] as const;

const insertBrickSet616 = [
  option("black-painted", "Black Painted", "96100928"),
  option("black-glass", "Black Glass", "96100931"),
  option("handmade-brick", "Handmade Brick", "96100929"),
  option("herringbone-brick", "Herringbone Brick", "96100924", "96100924HB"),
  option("common-brick", "Common Brick", "96100924", "96100924SB"),
  option("ledgestone", "Ledgestone", "96100925"),
] as const;

const set = (
  modelSku: string,
  defaultMediaSkus: readonly string[],
  defaultFirebackId: string,
  display: { width: number; height: number },
  options: readonly OfficialFirebackDefinition[],
): OfficialFirebackSet => ({
  modelSku,
  defaultMediaSkus,
  defaultFirebackId,
  display,
  options,
});

export const FPX_OFFICIAL_FIREBACK_SETS: Readonly<Record<string, OfficialFirebackSet>> = {
  "564-trv-25k-deluxe": set(
    "98500277",
    ["94500626"],
    "handmade-brick",
    { width: 36, height: 23.6875 },
    firebacks564,
  ),
  "564-trv-25k-clean-face": set(
    "98500278",
    ["94500626"],
    "handmade-brick",
    { width: 36, height: 23.6875 },
    firebacks564,
  ),
  "564-tv-35k-deluxe": set(
    "98500297",
    ["94500626"],
    "handmade-brick",
    { width: 36, height: 23.6875 },
    firebacks564,
  ),
  "564-tv-35k-clean-face": set(
    "98500298",
    ["94500626"],
    "handmade-brick",
    { width: 36, height: 23.6875 },
    firebacks564,
  ),
  "864-trv-31k-deluxe": set(
    "98500186",
    ["94500721"],
    "common-brick",
    { width: 41, height: 30.75 },
    firebacks864,
  ),
  "864-trv-31k-clean-face": set(
    "98500187",
    ["94500721"],
    "common-brick",
    { width: 41, height: 30.75 },
    firebacks864,
  ),
  "864-tv-40k-deluxe": set(
    "98500188",
    ["94500721"],
    "common-brick",
    { width: 41, height: 30.75 },
    firebacks864,
  ),
  "864-tv-40k-clean-face": set(
    "98500189",
    ["94500721"],
    "common-brick",
    { width: 41, height: 30.75 },
    firebacks864,
  ),
  "4237-ember-glo-clean-face": set(
    "98500344",
    ["94500983"],
    "handmade-brick",
    { width: 43.75, height: 39 },
    firebacks4237,
  ),
  "4415-high-output-deluxe": set(
    "98500328",
    ["94500580"],
    "black-glass",
    { width: 44, height: 15 },
    [
      option("black-painted", "Black Painted", "96100973"),
      option("ledgestone", "Ledgestone", "96100974"),
      option("black-glass", "Black Glass", "96100970"),
      option("black-fluted", "Black Fluted", "96100969"),
    ],
  ),
  "6015-high-output-deluxe": set(
    "98500334",
    ["94500580"],
    "black-glass",
    { width: 60, height: 15 },
    [
      option("black-painted", "Black Painted", "96100983"),
      option("ledgestone", "Ledgestone", "96100984"),
      option("black-glass", "Black Glass", "96100980"),
      option("black-fluted", "Black Fluted", "96100989"),
    ],
  ),
  "probuilder-36-clean-face-mv": set(
    "98500222",
    ["94500626"],
    "common-brick",
    { width: 36, height: 33.1875 },
    [
      option("black-glass", "Black Glass", "96100851"),
      option("common-brick", "Common Brick", "96100852"),
    ],
  ),
  "probuilder-36-clean-face-gsb": set(
    "98500223",
    ["94500626"],
    "common-brick",
    { width: 36, height: 33.1875 },
    [
      option("black-glass", "Black Glass", "96100851"),
      option("common-brick", "Common Brick", "96100852"),
    ],
  ),
  "probuilder-36-clean-face-deluxe": set(
    "98500231",
    ["94500626"],
    "common-brick",
    { width: 36, height: 33.1875 },
    [
      option("black-glass", "Black Glass", "96100851"),
      option("common-brick", "Common Brick", "96100852"),
    ],
  ),
  "probuilder-36-clean-face-see-thru": set(
    "98500237",
    ["94500642"],
    "common-brick",
    { width: 36, height: 33.1875 },
    [
      option("black-glass", "Black Glass", "96100857"),
      option("common-brick", "Common Brick", "96100858"),
    ],
  ),
  "probuilder-42-clean-face-deluxe": set(
    "98500232",
    ["94500771"],
    "common-brick",
    { width: 42, height: 40.25 },
    [
      option("black-glass", "Black Glass", "96100861"),
      option("common-brick", "Common Brick", "96100862"),
    ],
  ),
  "probuilder-42-linear-deluxe": set(
    "98500264",
    ["94500580"],
    "black-glass",
    { width: 42, height: 15 },
    [
      option("black-glass", "Black Glass", "96100802"),
      option("ledgestone", "Ledgestone", "96100803"),
    ],
  ),
  "probuilder-54-linear-deluxe": set(
    "98500268",
    ["94500580"],
    "black-glass",
    { width: 54, height: 15 },
    [
      option("black-glass", "Black Glass", "96100805"),
      option("ledgestone", "Ledgestone", "96100806"),
    ],
  ),
  "probuilder-72-linear-gsb": set(
    "98500263",
    ["94500580"],
    "black-glass",
    { width: 72, height: 15 },
    [
      option("black-glass", "Black Glass", "96100809"),
      option("ledgestone", "Ledgestone", "96100810"),
    ],
  ),
  "probuilder-72-linear-deluxe": set(
    "98500266",
    ["94500580"],
    "black-glass",
    { width: 72, height: 15 },
    [
      option("black-glass", "Black Glass", "96100809"),
      option("ledgestone", "Ledgestone", "96100810"),
    ],
  ),
  "32-dvs-deluxe-ember-glo": set(
    "98400371",
    ["94500957"],
    "handmade-brick",
    { width: 25.25, height: 13.75 },
    insertBrickSet32,
  ),
  "430-deluxe-ember-glo": set(
    "98400113",
    ["94500957"],
    "handmade-brick",
    { width: 24, height: 17 },
    insertBrickSet430,
  ),
  "430-mod-fyre": set("98400114", ["94500580"], "black-painted", { width: 24, height: 17 }, [
    option("black-painted", "Black Painted", "96100920"),
    option("black-glass", "Black Glass", "96100922"),
  ]),
  "34-dvl-deluxe-ember-glo": set(
    "98400376",
    ["94500952"],
    "handmade-brick",
    { width: 28, height: 17.125 },
    insertBrickSet34,
  ),
  "616-deluxe-ember-glo": set(
    "98400120",
    ["94500952"],
    "handmade-brick",
    { width: 28.5, height: 20.75 },
    insertBrickSet616,
  ),
  "616-mod-fyre": set(
    "98400121",
    ["94500580"],
    "black-painted",
    { width: 28.5, height: 20.75 },
    [
      option("black-painted", "Black Painted", "96100928"),
      option("black-glass", "Black Glass", "96100931"),
    ],
  ),
};

export const FPX_FIREBACK_AUDIT = {
  checkedAt: "2026-08-11",
  productEndpoint: "https://firebuilder.travisindustries.com/api/product/{productId}/pl/1/cy/1",
  accessoryEndpoint:
    "https://firebuilder.travisindustries.com/api/product/{productId}/pl/1/accessory",
  imageRoot: "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900",
} as const;
