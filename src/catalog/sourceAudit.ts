import type { CatalogIntake } from "@/catalog/intakeSchema";

export type CatalogSourceKind = "page" | "pdf" | "image" | "video" | "json";

export type CatalogSourceReference = {
  url: string;
  kind: CatalogSourceKind;
  owners: string[];
};

export type CatalogSourceAuditResult = CatalogSourceReference & {
  ok: boolean;
  status: number | null;
  contentType: string | null;
  finalUrl: string | null;
  error: string | null;
};

type SourceCollectionOptions = {
  includeIndexedProducts?: boolean;
};

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function inferCatalogSourceKind(url: string): CatalogSourceKind {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.includes("/api/")) return "json";
  if (pathname.endsWith(".pdf")) return "pdf";
  if (/\.(?:avif|gif|jpe?g|png|webp)$/.test(pathname)) return "image";
  if (/\.(?:m4v|mov|mp4|webm)$/.test(pathname)) return "video";
  return "page";
}

function mergeSource(
  sources: Map<string, CatalogSourceReference>,
  url: string,
  owner: string,
  forcedKind?: CatalogSourceKind,
): void {
  const kind = forcedKind ?? inferCatalogSourceKind(url);
  const existing = sources.get(url);
  if (existing) {
    if (forcedKind && existing.kind !== kind) {
      throw new Error(`Conflicting source kinds for ${url}: ${existing.kind} and ${kind}`);
    }
    if (!existing.owners.includes(owner)) existing.owners.push(owner);
    return;
  }
  sources.set(url, { url, kind, owners: [owner] });
}

export function collectCatalogSourceReferences(
  intakes: CatalogIntake[],
  options: SourceCollectionOptions = {},
): CatalogSourceReference[] {
  const sources = new Map<string, CatalogSourceReference>();

  intakes.forEach((intake) => {
    intake.sourceUrls.forEach((url) =>
      mergeSource(sources, url, `${intake.brandId}:index`, "page"),
    );
    intake.products.forEach((product) => {
      if (!options.includeIndexedProducts && product.stage === "source-indexed") return;
      const owner = `${intake.brandId}:${product.id}`;
      mergeSource(sources, product.productUrl, owner, "page");
      mergeSource(sources, product.officialIndexUrl, owner, "page");
      const evidence = product.evidence;
      if (!evidence) return;
      mergeSource(sources, evidence.installationManualUrl, owner, "pdf");
      if ("visualMaster" in evidence) {
        evidence.visualMaster.candidates.forEach((candidate) =>
          mergeSource(
            sources,
            candidate.sourceUrl,
            owner,
            candidate.kind === "cad-bim" ? undefined : "image",
          ),
        );
      }
      if ("visualSourceUrls" in evidence) {
        evidence.visualSourceUrls.forEach((url) => mergeSource(sources, url, owner));
      }
    });
  });

  return [...sources.values()]
    .map((source) => ({ ...source, owners: [...source.owners].sort() }))
    .sort((a, b) => a.url.localeCompare(b.url));
}

function contentTypeMatches(kind: CatalogSourceKind, contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  if (kind === "json") return normalized.includes("application/json");
  if (kind === "pdf") return normalized.includes("application/pdf");
  if (kind === "image") return normalized.startsWith("image/");
  if (kind === "video") return normalized.startsWith("video/");
  return normalized.includes("text/html");
}

export async function probeCatalogSource(
  source: CatalogSourceReference,
  fetchImpl: FetchLike = fetch,
  timeoutMs = 15_000,
): Promise<CatalogSourceAuditResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(source.url, {
      headers: {
        Accept:
          source.kind === "json"
            ? "application/json"
            : source.kind === "pdf"
              ? "application/pdf"
              : source.kind === "image"
                ? "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8"
                : source.kind === "video"
                  ? "video/mp4,video/webm,video/*;q=0.8"
                  : "text/html,application/xhtml+xml",
        Range: source.kind === "json" ? "bytes=0-1048575" : "bytes=0-2047",
        "User-Agent": "FireDesignCatalogAudit/1.0 (+https://firedesign-tool.vercel.app)",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type");
    const base = {
      ...source,
      status: response.status,
      contentType,
      finalUrl: response.url || source.url,
    };
    if (!response.ok) {
      await response.body?.cancel();
      return { ...base, ok: false, error: `HTTP ${response.status}` };
    }
    if (!contentType || !contentTypeMatches(source.kind, contentType)) {
      await response.body?.cancel();
      return {
        ...base,
        ok: false,
        error: `Expected ${source.kind}, received ${contentType ?? "no content type"}`,
      };
    }
    if (source.kind === "json") {
      const payload: unknown = await response.json();
      if (payload === null || (typeof payload !== "object" && !Array.isArray(payload))) {
        return { ...base, ok: false, error: "JSON payload is not an object or array" };
      }
    } else {
      await response.body?.cancel();
    }
    return { ...base, ok: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    return {
      ...source,
      ok: false,
      status: null,
      contentType: null,
      finalUrl: null,
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function auditCatalogSources(
  sources: CatalogSourceReference[],
  options: { concurrency?: number; timeoutMs?: number; fetchImpl?: FetchLike } = {},
): Promise<CatalogSourceAuditResult[]> {
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 6, 16));
  const results = new Array<CatalogSourceAuditResult>(sources.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < sources.length) {
      const index = nextIndex;
      nextIndex += 1;
      const source = sources[index];
      if (!source) continue;
      results[index] = await probeCatalogSource(
        source,
        options.fetchImpl,
        options.timeoutMs ?? 15_000,
      );
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, sources.length) }, worker));
  return results;
}
