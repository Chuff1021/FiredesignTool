import { FPX_CURRENT_INTAKE } from "@/catalog/intake";
import { catalogIntakeRegistrySchema, summarizeCatalogIntake } from "@/catalog/intakeSchema";
import { MAJESTIC_CURRENT_INTAKE } from "@/catalog/intakes/majestic-2026.07.31";
import { SUPERIOR_CURRENT_INTAKE } from "@/catalog/intakes/superior-2026.07.31";

export const CURRENT_CATALOG_INTAKES = catalogIntakeRegistrySchema.parse([
  FPX_CURRENT_INTAKE,
  SUPERIOR_CURRENT_INTAKE,
  MAJESTIC_CURRENT_INTAKE,
]);

export function summarizeIntakeRegistry() {
  const brands = CURRENT_CATALOG_INTAKES.map(summarizeCatalogIntake);
  return {
    brands,
    totalFamilies: brands.reduce((total, brand) => total + brand.totalFamilies, 0),
    approvedCatalogProducts: brands.reduce(
      (total, brand) => total + brand.approvedCatalogProducts,
      0,
    ),
    remainingFamilies: brands.reduce((total, brand) => total + brand.remainingFamilies, 0),
  };
}
