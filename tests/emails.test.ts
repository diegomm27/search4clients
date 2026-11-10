import { describe, it, expect } from "vitest";
import { extractAllEmails, rankEmails } from "../lib/enrich/fetch";

describe("extractAllEmails", () => {
  it("reads mailto links, visible text and [at]/(arroba) obfuscation", () => {
    const html = `<body>
      <a href="mailto:info@academia.es?subject=hola">Escríbenos</a>
      <p>Secretaría: secretaria [at] academia [dot] es</p>
      <p>También academiaopos(arroba)gmail.com</p>
      <img src="logo@2x.png">
    </body>`;
    const emails = extractAllEmails(html);
    expect(emails).toContain("info@academia.es");
    expect(emails).toContain("secretaria@academia.es");
    expect(emails).toContain("academiaopos@gmail.com");
    expect(emails.some((e) => e.includes("@2x"))).toBe(false);
  });

  it("decodes Cloudflare-protected emails", () => {
    // "a@b.es" XOR 0x11
    const key = 0x11;
    const hex = key.toString(16).padStart(2, "0") + [..."a@b.es"].map((c) => (c.charCodeAt(0) ^ key).toString(16).padStart(2, "0")).join("");
    expect(extractAllEmails(`<body><span data-cfemail="${hex}"></span></body>`)).toContain("a@b.es");
  });
});

describe("rankEmails", () => {
  it("puts the site's own domain first and free providers last", () => {
    expect(rankEmails(["x@gmail.com", "info@otra.es", "hola@academia.es"], "www.academia.es")).toEqual([
      "hola@academia.es",
      "info@otra.es",
      "x@gmail.com"
    ]);
  });
});
