import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { PlacesProvider } from "../lib/scan/providers/places";
import type { ProviderRequest } from "../lib/scan/types";

const request: ProviderRequest = {
  industry: "Dental clinics",
  country: "Spain",
  countryIso: "ES",
  region: "La Rioja",
  city: null,
  placesKeyword: "clinica dental"
};

function place(id: string, phone: string) {
  return {
    name: `places/${id}`,
    displayName: { text: `Clinic ${id}` },
    formattedAddress: "Logroño",
    location: { latitude: 42.46, longitude: -2.44 },
    internationalPhoneNumber: phone,
    nationalPhoneNumber: phone.replace("+34 ", "")
  };
}

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, statusText: "OK", json: async () => body, text: async () => JSON.stringify(body) };
}

describe("PlacesProvider", () => {
  let cacheDir: string;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    cacheDir = await mkdtemp(path.join(tmpdir(), "s4c-places-"));
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(cacheDir, { recursive: true, force: true });
  });

  it("asks for the phone fields and nextPageToken, and follows pagination", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ places: [place("a", "+34 941 000 001")], nextPageToken: "page-2" }))
      .mockResolvedValueOnce(jsonResponse({ places: [place("b", "+34 941 000 002")] }));

    const provider = new PlacesProvider("test-key", { cacheDir, delayMs: 0 });
    const records = await provider.scan(request, { cacheDir, maxPages: 3, delayMs: 0 });

    const fieldMask: string = fetchMock.mock.calls[0][1].headers["X-Goog-FieldMask"];
    expect(fieldMask.split(",")).toEqual(expect.arrayContaining(["nextPageToken", "places.internationalPhoneNumber", "places.nationalPhoneNumber"]));
    expect(fieldMask).not.toContain("places.phoneNumber");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).pageToken).toBe("page-2");
    expect(records.map((r) => [r.name, r.phone])).toEqual([
      ["Clinic a", "+34 941 000 001"],
      ["Clinic b", "+34 941 000 002"]
    ]);
  });

  it("caches single-page results and returns the same records on a cache hit", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ places: [place("a", "+34 941 000 001")] }));
    const provider = new PlacesProvider("test-key", { cacheDir, delayMs: 0 });

    const first = await provider.scan(request, { cacheDir, maxPages: 3, delayMs: 0 });
    const second = await provider.scan(request, { cacheDir, maxPages: 3, delayMs: 0 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(second[0].phone).toBe("+34 941 000 001");
  });

  it("uses a different cache file for queries that share a long prefix", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ places: [place("a", "+34 941 000 001")] }));
    const provider = new PlacesProvider("test-key", { cacheDir, delayMs: 0 });
    const longKeyword = "clinica dental especializada en implantes y ortodoncia invisible";

    await provider.scan({ ...request, placesKeyword: longKeyword, region: "La Rioja" }, { cacheDir, maxPages: 1, delayMs: 0 });
    await provider.scan({ ...request, placesKeyword: longKeyword, region: "Navarra" }, { cacheDir, maxPages: 1, delayMs: 0 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(await readdir(cacheDir)).toHaveLength(2);
  });
});
