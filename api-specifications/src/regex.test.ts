import {
  RegExp_Hex,
  RegExp_Hex_AnyLength,
  RegExp_Hex_MinLength,
  RegExp_NotEmptyString,
  RegExp_UUIDv4,
  RegExp_UUIDv4_Or_Empty,
  RegExp_Base64,
  RegExp_ISCO_Group_Code,
  RegExp_Local_Group_Code,
  RegExp_ESCO_Occupation_Code,
  RegExp_ESCO_Local_Occupation_Code,
  RegExp_Local_Occupation_Code,
  RegExp_ESCO_Local_Or_Local_Occupation_Code,
} from "./regex";

import "jest-performance-matchers";

const WHITESPACE = " \n\r\t";
const PERF_DURATION = 5;
describe("Test RegExp_NotEmptyString", () => {
  test.each([["abc"], [" abc"], [" abc "], ["abc "], ["a b c"], [" a b c"], [" a b c "]])(
    "It should successfully test true non whitespace strings '%s'",
    (s) => {
      expect(RegExp_NotEmptyString.test(s)).toBe(true);
    }
  );

  test.each([
    ["empty", ""],
    ["only spaces", " "],
    ["whitespace", WHITESPACE],
  ])("It should successfully test false string '%s'", (description, value) => {
    expect(RegExp_NotEmptyString.test(value)).toBe(false);
  });

  test.each([
    ["long string", " a b c".repeat(65536)],
    ["long string only spaces", " ".repeat(65536)],
    ["long string only whitespace", WHITESPACE.repeat(65536)],
  ])(
    `It perform fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`,
    async (description, value) => {
      expect(() => {
        RegExp_NotEmptyString.test(value);
      }).toCompleteWithinQuantile(PERF_DURATION, {
        iterations: 10,
        quantile: 90,
      });
    }
  );
});

describe("Test RegExp_Hex fixed length", () => {
  test.each([[""], ["0"], ["f"], ["09"], ["af"], ["09".repeat(2)], ["af".repeat(2)], ["09af".repeat(2)]])(
    "It should successfully test true to Hex string '%s'",
    (s) => {
      expect(RegExp_Hex(s.length).test(s)).toBe(true);
    }
  );

  test.each([["-0"], ["0-9"], ["a-f"], ["0-9a-f"], ["0-9,a-f"], ["0-9 a-f"], ["g"]])(
    "It should successfully test false to string '%s'",
    (s) => {
      expect(RegExp_Hex(s.length).test(s)).toBe(false);
    }
  );

  test.each([
    ["", 1],
    ["0", 0],
    ["0", 2],
    ["0a", 1],
    ["0a", 3],
  ])("It should successfully test false to hex string %s with incorrect length %s", (s, l) => {
    expect(RegExp_Hex(l).test(s)).toBe(false);
  });

  test.each([
    ["long hex", "9a".repeat(65535)],
    ["long non hex", "ghi".repeat(65535)],
  ])(
    `It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`,
    async (description, value) => {
      const regex = RegExp_Hex(value.length);
      expect(() => {
        regex.test(value);
      }).toCompleteWithinQuantile(PERF_DURATION, {
        iterations: 10,
        quantile: 90,
      });
    }
  );
});

describe("Test RegExp_Hex minimum length", () => {
  test.each([
    ["0", 0],
    ["f", 1],
    ["09", 1],
    ["af", 2],
    ["09".repeat(2), 3],
    ["af".repeat(2), 4],
    ["09af".repeat(2), 4],
  ])("It should successfully test true to Hex string '%s'", (s, minLength) => {
    expect(RegExp_Hex_MinLength(minLength).test(s)).toBe(true);
  });

  test.each([["-0"], ["0-9"], ["a-f"], ["0-9a-f"], ["0-9,a-f"], ["0-9 a-f"], ["g"]])(
    "It should successfully test false to string '%s'",
    (s) => {
      expect(RegExp_Hex_MinLength(0).test(s)).toBe(false);
    }
  );

  test.each([
    ["0", 2],
    ["af", 4],
  ])("It should successfully test false to hex string %s with less that min length", (s, l) => {
    expect(RegExp_Hex_MinLength(l).test(s)).toBe(false);
  });

  test.each([
    ["long hex", "9a".repeat(65535)],
    ["long non hex", "ghi".repeat(65535)],
  ])(
    `It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`,
    async (description, value) => {
      const regex = RegExp_Hex_MinLength(value.length - 1);
      expect(() => {
        regex.test(value);
      }).toCompleteWithinQuantile(PERF_DURATION, {
        iterations: 10,
        quantile: 90,
      });
    }
  );
});

describe("Test RegExp_Hex_AnyLength", () => {
  test.each([["0"], ["f"], ["09"], ["af"], ["09".repeat(2)], ["af".repeat(2)], ["09af".repeat(2)]])(
    "It should successfully test true to Hex string '%s'",
    (s) => {
      expect(RegExp_Hex_AnyLength.test(s)).toBe(true);
    }
  );

  test.each([[""], ["-0"], ["0-9"], ["a-f"], ["0-9a-f"], ["0-9,a-f"], ["0-9 a-f"], ["g"]])(
    "It should successfully test false to string '%s'",
    (s) => {
      expect(RegExp_Hex_AnyLength.test(s)).toBe(false);
    }
  );

  test.each([
    ["long hex", "9a".repeat(65535)],
    ["long non hex", "ghi".repeat(65535)],
  ])(
    `It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`,
    async (description, value) => {
      expect(() => {
        RegExp_Hex_AnyLength.test(value);
      }).toCompleteWithinQuantile(PERF_DURATION, {
        iterations: 10,
        quantile: 90,
      });
    }
  );
});

describe("Test RegExp_UUIDv4", () => {
  test.each([
    ["00000000-0000-0000-0000-000000000000"],
    ["99999999-9999-9999-9999-999999999999"],
    ["12345678-9012-2345-7890-123456123456"],
    ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
    ["ffffffff-ffff-ffff-ffff-ffffffffffff"],
    ["abdcefab-cdef-abcd-efab-abcdefabcdef"],
    ["f81d4fae-7dec-11d0-a765-00a0c91e6bf6"],
  ])("It should successfully test true to '%s'", (s) => {
    expect(RegExp_UUIDv4.test(s)).toBe(true);
  });

  test.each([
    ["00000000-0000-0000-0000"],
    ["123456789-9012-2345-7890-123456123456"],
    ["gggggggg-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
    ["ffffffff-ffff-ffff-ffffffffffff"],
  ])("It should successfully test false to '%s'", (s) => {
    expect(RegExp_UUIDv4.test(s)).toBe(false);
  });

  test.each([
    ["correct uuid", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"],
    ["incorrect uuid", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6x"],
    ["incorrect uuid long", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6".repeat(65535)],
  ])(
    `It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`,
    async (description, value) => {
      expect(() => {
        RegExp_UUIDv4.test(value);
      }).toCompleteWithinQuantile(PERF_DURATION, {
        iterations: 10,
        quantile: 90,
      });
    }
  );
});

describe("Test RegExp_UUIDv4_Or_Empty", () => {
  test.each([
    [""],
    ["00000000-0000-0000-0000-000000000000"],
    ["99999999-9999-9999-9999-999999999999"],
    ["12345678-9012-2345-7890-123456123456"],
    ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
    ["ffffffff-ffff-ffff-ffff-ffffffffffff"],
    ["abdcefab-cdef-abcd-efab-abcdefabcdef"],
    ["f81d4fae-7dec-11d0-a765-00a0c91e6bf6"],
  ])("It should successfully test true to '%s'", (s) => {
    expect(RegExp_UUIDv4_Or_Empty.test(s)).toBe(true);
  });

  test.each([
    [" "],
    ["00000000-0000-0000-0000"],
    ["123456789-9012-2345-7890-123456123456"],
    ["gggggggg-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
    ["ffffffff-ffff-ffff-ffffffffffff"],
  ])("It should successfully test false to '%s'", (s) => {
    expect(RegExp_UUIDv4_Or_Empty.test(s)).toBe(false);
  });

  test.each([
    ["correct uuid", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"],
    ["incorrect uuid", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6x"],
    ["incorrect uuid long", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6".repeat(65535)],
    ["correct empty", ""],
    ["correct spaces long", " ".repeat(65535)],
  ])(
    `It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`,
    async (description, value) => {
      expect(() => {
        RegExp_UUIDv4_Or_Empty.test(value);
      }).toCompleteWithinQuantile(PERF_DURATION, {
        iterations: 10,
        quantile: 90,
      });
    }
  );
});

describe("Test RegExp_Base64", () => {
  // Valid Base64 strings
  test.each([
    ["empty string", ""],
    ["simple string", "YWJj"], // "abc"
    ["padded string =", "YWJjZA=="], // "abcd"
    ["padded string ==", "YWJjZGU="], // "abcde"
    ["long string", "QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo".repeat(1000)],
  ])("It should successfully test true for '%s'", (_desc, value) => {
    expect(RegExp_Base64.test(value)).toBe(true);
  });

  // Invalid Base64 strings
  test.each([
    ["invalid char", "YWJj$"],
    ["invalid length", "YWJj="],
    ["whitespace", "YWJ j"],
    ["non-base64 chars", "abc!@#"],
    ["long invalid", "!!!".repeat(1000)],
  ])("It should successfully test false for '%s'", (_desc, value) => {
    expect(RegExp_Base64.test(value)).toBe(false);
  });

  // Performance test
  test.each([
    ["long valid string", "QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo=".repeat(1000)],
    ["long invalid string", "!!!".repeat(1000)],
  ])(`It performs fast (<=${PERF_DURATION}ms) for '%s'`, async (_desc, value) => {
    expect(() => {
      RegExp_Base64.test(value);
    }).toCompleteWithinQuantile(PERF_DURATION, { iterations: 10, quantile: 90 });
  });
});

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
