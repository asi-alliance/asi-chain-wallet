import { validateAccountName } from "./textUtils";

describe("account name validation", () => {
  it("accepts a readable account name", () => {
    expect(validateAccountName("Savings account 2")).toEqual({ isValid: true });
  });

  it("rejects empty and whitespace-only names", () => {
    for (const name of ["", " ", "\t\n"]) {
      expect(validateAccountName(name)).toEqual({
        isValid: false,
        error: "Account name is required",
      });
    }
  });

  it("accepts the maximum length and rejects names exceeding it", () => {
    expect(validateAccountName("a".repeat(30)).isValid).toBe(true);
    expect(validateAccountName("a".repeat(31))).toEqual({
      isValid: false,
      error: "Account name must be 30 characters or less",
    });
  });

  it("rejects names containing reserved characters", () => {
    for (const character of ['<', '>', ':', '"', '/', '\\', '|', '?', '*']) {
      expect(validateAccountName(`Savings${character}account`)).toEqual({
        isValid: false,
        error: "Account name contains invalid characters",
      });
    }
  });
});
