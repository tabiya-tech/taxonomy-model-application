import {
  RegExp_ESCO_Local_Occupation_Code,
  RegExp_ESCO_Local_Or_Local_Occupation_Code,
  RegExp_ESCO_Occupation_Code,
  RegExp_ISCO_Group_Code,
  RegExp_Local_Group_Code,
  RegExp_Local_Occupation_Code,
  RegExp_Skill_Group_Code,
} from "./regex";

describe("Test RegExp_ISCO_Group_Code", () => {
  // Valid ISCO Group codes
  test.each([
    ["1 digit", "1", true],
    ["4 digits", "1234", true],
    ["too many digits", "12345", false],
    ["letters not allowed", "12A", false],
    ["symbols not allowed", "123#", false],
    ["empty string", "", false],
  ])("It should return %s → %s", (_desc, value, expected) => {
    expect(RegExp_ISCO_Group_Code.test(value)).toBe(expected);
  });
});

describe("RegExp_Local_Group_Code", () => {
  // Valid Local Group codes
  test.each([
    ["letters only", "ABC", true],
    ["letters + digits", "ABC123", true],
    ["prefix digits + letters", "1234ABC", true],
    ["only digits", "1234", false], // must contain letters
    ["special chars not allowed", "AB_C", false],
    ["empty string", "", false],
  ])("It should return %s → %s", (_desc, value, expected) => {
    expect(RegExp_Local_Group_Code.test(value)).toBe(expected);
  });
});

describe("RegExp_ESCO_Occupation_Code", () => {
  // Valid ESCO Occupation codes
  test.each([
    ["valid 4 digits + .digit", "1234.1", true],
    ["valid 4 digits + .digits multiple", "1234.12.3", true],
    ["valid with larger sections", "5678.123.4567", true],
    ["missing .digits part", "1234", false],
    ["too few digits in prefix", "123.1", false],
    ["letters not allowed", "1234.A", false],
    ["symbols not allowed", "1234.1$", false],
    ["empty string", "", false],
  ])("It should return %s → %s", (_desc, value, expected) => {
    expect(RegExp_ESCO_Occupation_Code.test(value)).toBe(expected);
  });
});

describe("RegExp_ESCO_Local_Occupation_Code", () => {
  // Valid ESCO Local Occupation codes
  test.each([
    ["valid 4 digits + _digits", "1234_1", true],
    ["valid 4 digits + .digits + _digits", "1234.5_10", true],
    ["valid 4 digits + .digits multiple + _digits", "1234.56.7_12", true],
    ["multiple _digits suffixes", "1234.8_1_2", true],
    ["missing underscore part", "1234.5", false],
    ["underscore but no digits", "1234_", false],
    ["letters not allowed", "1234.5_A", false],
    ["empty string", "", false],
  ])("It should return %s → %s", (_desc, value, expected) => {
    expect(RegExp_ESCO_Local_Occupation_Code.test(value)).toBe(expected);
  });
});

describe("RegExp_Local_Occupation_Code", () => {
  // Valid Local Occupation codes
  test.each([
    ["letters + _digits", "ABC_1", true],
    ["letters + digits + _digits", "ABC123_45", true],
    ["digits only prefix + _digits", "1234_567", true],
    ["letters + multiple _digits suffixes", "ABC_1_2_3", true],
    ["prefix must exist", "_123", false],
    ["underscore but no digits after", "ABC_", false],
    ["special chars not allowed in prefix", "AB-C_12", false],
    ["empty string", "", false],
  ])("It should return %s → %s", (_desc, value, expected) => {
    expect(RegExp_Local_Occupation_Code.test(value)).toBe(expected);
  });
});

describe("RegExp_ESCO_Local_Or_Local_Occupation_Code", () => {
  test.each([
    // Valid ESCO Local Occupation codes
    ["ESCO local → 4 digits + _digits", "1234_1", true],
    ["ESCO local → 4 digits + .digits + _digits", "1234.5_10", true],
    ["ESCO local → 4 digits + multiple .digits + _digits", "1234.56.7_12", true],
    ["ESCO local → multiple _digits suffixes", "1234.8_1_2", true],

    // Valid Local Occupation codes
    ["Local → letters + _digits", "ABC_1", true],
    ["Local → letters + digits + _digits", "ABC123_45", true],
    ["Local → digits only prefix + _digits", "1234_567", true],
    ["Local → multiple _digits suffixes", "XYZ_1_2_3", true],

    // Invalid cases (should not match either regex)
    ["Missing underscore for ESCO", "1234.56", false],
    ["Missing underscore for Local", "ABC123", false],
    ["Invalid characters", "ABC-123_4", false],
    ["Empty string", "", false],
  ])("It should return %s → %s", (_desc, value, expected) => {
    expect(RegExp_ESCO_Local_Or_Local_Occupation_Code.test(value)).toBe(expected);
  });
});

describe("Test RegExp_Skill_Group_Code", () => {
  test.each([["L"], ["l"], ["L9"], ["l9"], ["L9.9"], ["L9.8.8.8"]])(
    "It should successfully test true to skill group code string '%s'",
    (s) => {
      expect(RegExp_Skill_Group_Code.test(s)).toBe(true);
    }
  );

  test.each([[""], ["LL"], ["L."], ["L.9"], ["L.9.9"], ["L9.9."], ["L9.9.L"]])(
    "It should successfully test false to string '%s'",
    (s) => {
      expect(RegExp_Skill_Group_Code.test(s)).toBe(false);
    }
  );

  test.each([
    ["long valid code", "L9" + ".9".repeat(65535), true],
    ["long invalid code", "ghi".repeat(65535), false],
    ["long empty code", " ".repeat(65535), false],
  ])("It should evaluate %s", (_description, value, expected) => {
    expect(RegExp_Skill_Group_Code.test(value)).toBe(expected);
  });
});
