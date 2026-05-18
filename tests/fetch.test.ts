import { describe, it, expect } from "vitest";
import { fetchAndParseSite } from "../lib/enrich/fetch";

describe("fetchAndParseSite", () => {
  it("returns null for unreachable URL", async () => {
    const result = await fetchAndParseSite("https://this-domain-does-not-exist-12345.com", { delayMs: 0 });
    expect(result).toBeNull();
  }, 10000);

  it("returns null for 404 URL", async () => {
    const result = await fetchAndParseSite("https://httpbin.org/status/404", { delayMs: 0 });
    expect(result).toBeNull();
  }, 10000);
});
