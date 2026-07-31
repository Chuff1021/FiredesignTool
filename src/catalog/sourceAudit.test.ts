import { describe, expect, it, vi } from "vitest";
import { CURRENT_CATALOG_INTAKES } from "@/catalog/intakeRegistry";
import {
  auditCatalogSources,
  collectCatalogSourceReferences,
  inferCatalogSourceKind,
  probeCatalogSource,
} from "@/catalog/sourceAudit";

describe("catalog source audit", () => {
  it("classifies official payloads by URL without guessing from query strings", () => {
    expect(inferCatalogSourceKind("https://maker.test/docs/manual.PDF?rev=2")).toBe("pdf");
    expect(inferCatalogSourceKind("https://maker.test/api/product/12")).toBe("json");
    expect(inferCatalogSourceKind("https://maker.test/assets/front.webp?v=3")).toBe("image");
    expect(inferCatalogSourceKind("https://maker.test/assets/burn.mp4?v=3")).toBe("video");
    expect(inferCatalogSourceKind("https://maker.test/products/insert")).toBe("page");
  });

  it("collects verified evidence once and excludes unverified product pages by default", () => {
    const verified = collectCatalogSourceReferences(CURRENT_CATALOG_INTAKES);
    const all = collectCatalogSourceReferences(CURRENT_CATALOG_INTAKES, {
      includeIndexedProducts: true,
    });
    expect(all.length).toBeGreaterThan(verified.length);
    expect(verified.some((source) => source.url.endsWith("100-01537.pdf"))).toBe(true);
    expect(
      verified.some((source) =>
        source.owners.includes("fireplace-xtrordinair:32-dvs-deluxe-ember-glo"),
      ),
    ).toBe(true);
    expect(new Set(verified.map((source) => source.url)).size).toBe(verified.length);
  });

  it("rejects a successful HTML error page when an image is expected", async () => {
    const result = await probeCatalogSource(
      { url: "https://maker.test/front.png", kind: "image", owners: ["maker:model"] },
      async () =>
        new Response("not an image", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    );
    expect(result).toMatchObject({
      ok: false,
      status: 200,
      error: "Expected image, received text/html",
    });
  });

  it("rejects HTTP failures and malformed JSON evidence", async () => {
    const notFound = await probeCatalogSource(
      { url: "https://maker.test/manual.pdf", kind: "pdf", owners: ["maker:model"] },
      async () => new Response("missing", { status: 404 }),
    );
    expect(notFound).toMatchObject({ ok: false, status: 404, error: "HTTP 404" });

    const malformed = await probeCatalogSource(
      { url: "https://maker.test/api/model", kind: "json", owners: ["maker:model"] },
      async () =>
        new Response("null", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    expect(malformed).toMatchObject({
      ok: false,
      error: "JSON payload is not an object or array",
    });
  });

  it("honors the requested concurrency without dropping result order", async () => {
    let active = 0;
    let maximumActive = 0;
    const fetchImpl = vi.fn(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return new Response("<html></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    });
    const sources = [1, 2, 3, 4].map((id) => ({
      url: `https://maker.test/${id}`,
      kind: "page" as const,
      owners: [`maker:${id}`],
    }));
    const results = await auditCatalogSources(sources, { concurrency: 2, fetchImpl });
    expect(maximumActive).toBe(2);
    expect(results.map((result) => result.url)).toEqual(sources.map((source) => source.url));
    expect(results.every((result) => result.ok)).toBe(true);
  });
});
