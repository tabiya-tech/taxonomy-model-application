import {
    RegExp_Hex,
    RegExp_Hex_AnyLength,
    RegExp_Hex_MinLength,
    RegExp_NotEmptyString,
    RegExp_UUIDv4, RegExp_UUIDv4_Or_Empty
} from "./regex";

import 'jest-performance-matchers';

const WHITESPACE = " \n\r\t";
const PERF_DURATION = 5;
describe("Test RegExp_NotEmptyString", () => {
    test.each([
        ["abc"],
        [" abc"],
        [" abc "],
        ["abc "],
        ["a b c"],
        [" a b c"],
        [" a b c "]
    ])("It should successfully test true non whitespace strings '%s'", (s) => {
        expect(RegExp_NotEmptyString.test(s)).toBe(true);
    });

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
    ])(`It perform fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`, async (description, value) => {
        expect(() => {
            RegExp_NotEmptyString.test(value);
        }).toCompleteWithinQuantile(PERF_DURATION, {iterations: 10, quantile: 90});
    });
});

describe("Test RegExp_Hex fixed length", () => {
    test.each([
        [""],
        ["0"],
        ["f"],
        ["09"],
        ["af"],
        ["09".repeat(2)],
        ["af".repeat(2)],
        ["09af".repeat(2)],
    ])("It should successfully test true to Hex string '%s'", (s) => {
        expect(RegExp_Hex(s.length).test(s)).toBe(true);
    });

    test.each([
        ["-0"],
        ["0-9"],
        ["a-f"],
        ["0-9a-f"],
        ["0-9,a-f"],
        ["0-9 a-f"],
        ["g"]
    ])("It should successfully test false to string '%s'", (s) => {
        expect(RegExp_Hex(s.length).test(s)).toBe(false);
    });

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
    ])(`It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`, async (description, value) => {
        const regex = RegExp_Hex(value.length);
        expect(() => {
            regex.test(value);
        }).toCompleteWithinQuantile(PERF_DURATION, {iterations: 10, quantile: 90});
    });
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

    test.each([
        ["-0"],
        ["0-9"],
        ["a-f"],
        ["0-9a-f"],
        ["0-9,a-f"],
        ["0-9 a-f"],
        ["g"]
    ])("It should successfully test false to string '%s'", (s) => {
        expect(RegExp_Hex_MinLength(0).test(s)).toBe(false);
    });

    test.each([
        ["0", 2],
        ["af", 4]
    ])("It should successfully test false to hex string %s with less that min length", (s, l) => {
        expect(RegExp_Hex_MinLength(l).test(s)).toBe(false);
    });

    test.each([
        ["long hex", "9a".repeat(65535)],
        ["long non hex", "ghi".repeat(65535)],
    ])(`It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`, async (description, value) => {
        const regex = RegExp_Hex_MinLength(value.length - 1);
        expect(() => {
            regex.test(value);
        }).toCompleteWithinQuantile(PERF_DURATION, {iterations: 10, quantile: 90});
    });
});

describe("Test RegExp_Hex_AnyLength", () => {
    test.each([
        ["0"],
        ["f"],
        ["09"],
        ["af"],
        ["09".repeat(2)],
        ["af".repeat(2)],
        ["09af".repeat(2)],
    ])("It should successfully test true to Hex string '%s'", (s) => {
        expect(RegExp_Hex_AnyLength.test(s)).toBe(true);
    });

    test.each([
        [""],
        ["-0"],
        ["0-9"],
        ["a-f"],
        ["0-9a-f"],
        ["0-9,a-f"],
        ["0-9 a-f"],
        ["g"]
    ])("It should successfully test false to string '%s'", (s) => {
        expect(RegExp_Hex_AnyLength.test(s)).toBe(false);
    });

    test.each([
        ["long hex", "9a".repeat(65535)],
        ["long non hex", "ghi".repeat(65535)],
    ])(`It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`, async (description, value) => {
        expect(() => {
            RegExp_Hex_AnyLength.test(value);
        }).toCompleteWithinQuantile(PERF_DURATION, {iterations: 10, quantile: 90});
    });
});

describe("Test RegExp_UUIDv4", () => {
    test.each([
        ["00000000-0000-0000-0000-000000000000"],
        ["99999999-9999-9999-9999-999999999999"],
        ["12345678-9012-2345-7890-123456123456"],
        ["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
        ["ffffffff-ffff-ffff-ffff-ffffffffffff"],
        ["abdcefab-cdef-abcd-efab-abcdefabcdef"],
        ["f81d4fae-7dec-11d0-a765-00a0c91e6bf6"]
    ])("It should successfully test true to '%s'", (s) => {
        expect(RegExp_UUIDv4.test(s)).toBe(true);
    });

    test.each([
        ["00000000-0000-0000-0000"],
        ["123456789-9012-2345-7890-123456123456"],
        ["gggggggg-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
        ["ffffffff-ffff-ffff-ffffffffffff"]
    ])("It should successfully test false to '%s'", (s) => {
        expect(RegExp_UUIDv4.test(s)).toBe(false);
    });

    test.each([
        ["correct uuid", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"],
        ["incorrect uuid", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6x"],
        ["incorrect uuid long", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6".repeat(65535)],
    ])(`It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`, async (description, value) => {
        expect(() => {
            RegExp_UUIDv4.test(value);
        }).toCompleteWithinQuantile(PERF_DURATION, {iterations: 10, quantile: 90});
    });
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
        ["f81d4fae-7dec-11d0-a765-00a0c91e6bf6"]
    ])("It should successfully test true to '%s'", (s) => {
        expect(RegExp_UUIDv4_Or_Empty.test(s)).toBe(true);
    });

    test.each([
        [" "],
        ["00000000-0000-0000-0000"],
        ["123456789-9012-2345-7890-123456123456"],
        ["gggggggg-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
        ["ffffffff-ffff-ffff-ffffffffffff"]
    ])("It should successfully test false to '%s'", (s) => {
        expect(RegExp_UUIDv4_Or_Empty.test(s)).toBe(false);
    });

    test.each([
        ["correct uuid", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"],
        ["incorrect uuid", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6x"],
        ["incorrect uuid long", "f81d4fae-7dec-11d0-a765-00a0c91e6bf6".repeat(65535)],
        ["correct empty", ""],
        ["correct spaces long", " ".repeat(65535)],
    ])(`It performs fast (<=${PERF_DURATION}ms) and does not hang/cause catastrophic backtracking for '%s'`, async (description, value) => {
        expect(() => {
            RegExp_UUIDv4_Or_Empty.test(value);
        }).toCompleteWithinQuantile(PERF_DURATION, {iterations: 10, quantile: 90});
    });
});

