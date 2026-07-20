import { escapeRegExp } from "./escapeRegExp";

describe("escapeRegExp", () => {
  test("should leave a plain string unchanged", () => {
    // GIVEN a string with no regex special characters
    const given = "software engineer";

    // WHEN it is escaped THEN expect it unchanged
    expect(escapeRegExp(given)).toBe("software engineer");
  });

  test.each([
    [".", "\\."],
    ["*", "\\*"],
    ["+", "\\+"],
    ["?", "\\?"],
    ["^", "\\^"],
    ["$", "\\$"],
    ["{", "\\{"],
    ["}", "\\}"],
    ["(", "\\("],
    [")", "\\)"],
    ["|", "\\|"],
    ["[", "\\["],
    ["]", "\\]"],
    ["\\", "\\\\"],
  ])("should escape the special character %s", (given, expected) => {
    // WHEN the special character is escaped THEN expect it prefixed with a backslash
    expect(escapeRegExp(given)).toBe(expected);
  });

  test("should escape a value so it matches literally when used as a regex", () => {
    // GIVEN a value that would otherwise be a wildcard regex
    const givenValue = "a.b*c";

    // WHEN it is escaped and used as a regex
    const regex = new RegExp(escapeRegExp(givenValue));

    // THEN expect it to match the literal string and not the wildcard interpretation
    expect(regex.test("a.b*c")).toBe(true);
    expect(regex.test("axbxxc")).toBe(false);
  });
});
