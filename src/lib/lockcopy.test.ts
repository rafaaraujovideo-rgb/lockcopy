import { describe, expect, it } from "vitest";

import { answerLabel, orgSlug, requestLinkState, uploadProblem } from "./lockcopy";
import { zipEntries } from "./exports";

const now = new Date("2026-11-21T12:00:00Z");

describe("client link state", () => {
  it("switched-off link shows revoked", () => {
    expect(requestLinkState({ revoked_at: "2026-11-20T00:00:00Z", expires_at: "2027-01-01T00:00:00Z" }, now)).toBe("revoked");
  });
  it("link past the deadline shows expired", () => {
    expect(requestLinkState({ revoked_at: null, expires_at: "2026-11-21T11:59:59Z" }, now)).toBe("expired");
  });
  it("link within the deadline shows active", () => {
    expect(requestLinkState({ revoked_at: null, expires_at: "2026-12-21T00:00:00Z" }, now)).toBe("active");
  });
});

describe("answer states", () => {
  it("answer returned by the agency shows as adjust", () => {
    expect(answerLabel("rejected")).toBe("adjust");
  });
  it("field without an answer shows as empty", () => {
    expect(answerLabel(undefined)).toBe("empty");
  });
});

describe("50 MB upload limit", () => {
  it("accepts a file of exactly 50 MB", () => {
    expect(uploadProblem({ name: "a.jpg", size: 50 * 1024 * 1024, type: "image/jpeg" })).toBeNull();
  });
  it("rejects a file above 50 MB", () => {
    expect(uploadProblem({ name: "a.jpg", size: 50 * 1024 * 1024 + 1, type: "image/jpeg" })).toMatch(/50 MB/);
  });
  it("rejects a non-accepted type", () => {
    expect(uploadProblem({ name: "a.exe", size: 10, type: "application/x-msdownload" })).toMatch(/not accepted/);
  });
});

describe("agency slug", () => {
  it("generates a database-safe slug even with accents", () => {
    expect(orgSlug("Studio Çaö & Sons", "ab12")).toMatch(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/);
  });
});

describe("ZIP per page", () => {
  it("organizes original and WebP by page and field, with no duplicate names", () => {
    const entries = zipEntries({
      title: "Site",
      client: "Client",
      sections: [{ id: "s", title: "Café Home", fields: [{ id: "f", label: "Cover photo", field_type: "image" }] }],
      text: {},
      files: [
        { field_id: "f", file_name: "cover.jpg", storage_path: "o/t/f/1", webp_storage_path: "o/t/f/1.webp" },
        { field_id: "f", file_name: "cover.jpg", storage_path: "o/t/f/2", webp_storage_path: null },
      ],
    }).map((e) => e.zipPath);
    expect(entries).toEqual([
      "cafe-home/cover-photo/original/cover.jpg",
      "cafe-home/cover-photo/webp/cover.webp",
      "cafe-home/cover-photo/original/cover-2.jpg",
    ]);
  });
});
