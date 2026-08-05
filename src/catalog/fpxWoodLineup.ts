import { z } from "zod";

export const FPX_WOOD_LINEUP_CHECKED_AT = "2026-08-05";

export const FPX_WOOD_LINEUP_SOURCES = {
  woodFireplaces: "https://www.fireplacex.com/products/wood-fireplaces/",
  professionalSpecs: "https://www.fireplacex.com/professionals/specs-and-drawings/",
  currentManuals: "https://www.fireplacex.com/owner-resources/manuals/",
  fireBuilder: "https://firebuilder.travisindustries.com/",
} as const;

const lineupEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  sku: z.string().min(1),
  fireBuilderProductId: z.number().int().positive(),
  fireBuilderModelId: z.number().int().positive(),
  intakeId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sourceUrl: z.string().url(),
  manualUrl: z.string().url(),
  marketingStatus: z.literal("current"),
  factoryAvailability: z.literal("current-production"),
});

export const FPX_CURRENT_WOOD_LINEUP = z
  .array(lineupEntrySchema)
  .length(3)
  .parse([
    {
      id: "42-apex-nexgen-hybrid",
      name: "42 Apex NexGen-Hybrid",
      sku: "98500115",
      fireBuilderProductId: 138,
      fireBuilderModelId: 682,
      intakeId: "42-apex-nexgen-hybrid",
      sourceUrl: "https://www.fireplacex.com/product/42-apex/",
      manualUrl: "https://www.travisindustries.com/docs/100-01577.pdf",
      marketingStatus: "current",
      factoryAvailability: "current-production",
    },
    {
      id: "36-elite-nexgen-hybrid",
      name: "36 Elite NexGen-Hybrid",
      sku: "98500109",
      fireBuilderProductId: 160,
      fireBuilderModelId: 720,
      intakeId: "36-elite-nexgen-hybrid",
      sourceUrl: "https://www.fireplacex.com/product/36-elite-nexgen-hybrid/",
      manualUrl: "https://www.travisindustries.com/docs/100-01584.pdf",
      marketingStatus: "current",
      factoryAvailability: "current-production",
    },
    {
      id: "44-elite-nexgen-hybrid",
      name: "44 Elite NexGen-Hybrid",
      sku: "98500114",
      fireBuilderProductId: 141,
      fireBuilderModelId: 690,
      intakeId: "44-elite-nexgen-hybrid",
      sourceUrl: "https://www.fireplacex.com/product/44-elite-nexgen-hybrid/",
      manualUrl: "https://www.travisindustries.com/docs/100-01582.pdf",
      marketingStatus: "current",
      factoryAvailability: "current-production",
    },
  ]);

export type FpxWoodLineupEntry = z.infer<typeof lineupEntrySchema>;
