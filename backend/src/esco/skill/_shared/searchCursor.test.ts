import { decodeSearchCursor, encodeSearchCursor } from "./searchCursor";

describe("search cursor", () => {
  test.each([0, 5, 100, 1_000_000])("should round-trip the offset %s", (givenOffset) => {
    // WHEN the offset is encoded and then decoded
    const actual = decodeSearchCursor(encodeSearchCursor(givenOffset));

    // THEN expect the original offset back
    expect(actual).toBe(givenOffset);
  });

  test("should produce an opaque (base64) cursor string", () => {
    // WHEN an offset is encoded
    const actual = encodeSearchCursor(10);

    // THEN expect a base64 string that decodes to the offset payload
    expect(typeof actual).toBe("string");
    expect(JSON.parse(Buffer.from(actual, "base64").toString("utf-8"))).toEqual({ offset: 10 });
  });

  test.each([
    ["malformed base64/JSON", "not-base64-json-!@#$%"],
    ["a negative offset", Buffer.from(JSON.stringify({ offset: -1 })).toString("base64")],
    ["a non-integer offset", Buffer.from(JSON.stringify({ offset: 1.5 })).toString("base64")],
    ["a non-numeric offset", Buffer.from(JSON.stringify({ offset: "x" })).toString("base64")],
    ["a missing offset", Buffer.from(JSON.stringify({})).toString("base64")],
  ])("should throw when the cursor holds %s", (_description, givenCursor) => {
    // WHEN decoding an invalid cursor THEN expect it to throw
    expect(() => decodeSearchCursor(givenCursor)).toThrow();
  });
});
