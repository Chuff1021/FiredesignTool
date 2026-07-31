import {
  auditCatalogSources,
  collectCatalogSourceReferences,
} from "../src/catalog/sourceAudit";
import { CURRENT_CATALOG_INTAKES } from "../src/catalog/intakeRegistry";

const includeIndexedProducts = process.argv.includes("--all");
const concurrencyArgument = process.argv.find((argument) =>
  argument.startsWith("--concurrency="),
);
const timeoutArgument = process.argv.find((argument) => argument.startsWith("--timeout="));
const concurrency = concurrencyArgument ? Number(concurrencyArgument.split("=")[1]) : 6;
const timeoutMs = timeoutArgument ? Number(timeoutArgument.split("=")[1]) : 15_000;

if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
  throw new Error("--concurrency must be an integer from 1 through 16");
}
if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 120_000) {
  throw new Error("--timeout must be between 1000 and 120000 milliseconds");
}

const sources = collectCatalogSourceReferences(CURRENT_CATALOG_INTAKES, {
  includeIndexedProducts,
});
console.log(
  `Auditing ${sources.length} ${includeIndexedProducts ? "indexed and verified" : "verified"} official sources...`,
);
const results = await auditCatalogSources(sources, { concurrency, timeoutMs });
const failures = results.filter((result) => !result.ok);
const redirects = results.filter(
  (result) => result.finalUrl && new URL(result.finalUrl).href !== new URL(result.url).href,
);

for (const failure of failures) {
  console.error(
    `ERROR ${failure.kind} ${failure.url} (${failure.owners.join(", ")}): ${failure.error}`,
  );
}
for (const redirect of redirects) {
  console.log(`REDIRECT ${redirect.url} -> ${redirect.finalUrl}`);
}

const counts = new Map<string, number>();
results.forEach((result) => counts.set(result.kind, (counts.get(result.kind) ?? 0) + 1));
console.log(
  `Checked ${results.length}: ${[...counts.entries()]
    .map(([kind, count]) => `${kind}=${count}`)
    .join(", ")}; redirects=${redirects.length}; failures=${failures.length}`,
);

if (failures.length > 0) process.exitCode = 1;
