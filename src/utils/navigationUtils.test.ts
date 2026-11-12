import { buildUrlWithParams } from "./navigationUtils";

describe("URL construction", () => {
  it("leaves a URL unchanged when there are no parameters", () => {
    expect(buildUrlWithParams("/history", {})).toBe("/history");
  });

  it("encodes query values without letting them create extra parameters", () => {
    expect(buildUrlWithParams("/history", {
      pathParams: ["account", "42"],
      queryParams: [{ key: "search", value: "a&b +?/=" }],
    })).toBe("/history/account/42?search=a%26b+%2B%3F%2F%3D");
  });

  it("preserves repeated and empty values while ignoring empty keys", () => {
    expect(buildUrlWithParams("/history", {
      queryParams: [
        { key: "status", value: "pending" },
        { key: "status", value: "confirmed" },
        { key: "search", value: "" },
        { key: "", value: "ignored" },
      ],
    })).toBe("/history?status=pending&status=confirmed&search=");
  });
});
