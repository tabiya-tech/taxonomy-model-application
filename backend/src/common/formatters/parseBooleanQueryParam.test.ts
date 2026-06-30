import { parseBooleanQueryParam } from "./parseBooleanQueryParam";

describe("ParseBooleanQueryParam", () => {
  test.each([
    ["true", true],
    ["True", true],
    ["TRUE", true],
    ["false", false],
    ["False", false],
    ["FALSE", false],
    [undefined, false],
    [null, false],
  ])("should parse %s as %s", (givenQueryParamValue, expectedParsedValue) => {
    // GIVEN the query param value
    // WHEN parsing the query param value
    const actualValue = parseBooleanQueryParam(givenQueryParamValue as never);
    // THEN it should be as expected
    expect(actualValue).toEqual(expectedParsedValue);
  });
});
