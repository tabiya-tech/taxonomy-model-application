import { getCodeQueryParam } from "src/auth/utils/getCodeQueryParam";

describe('getCodeQueryParam function tests', () => {
  test("should return the code query param when it is set", () => {
    // GIVEN: A location with a code query param
    const location = { search: "?code=foo" }

    // WHEN getCodeQueryParam is called with the location
    const code = getCodeQueryParam(location)

    // THEN the code should be the expected value
    expect(code).toBe("foo")
  })

  test("should return an empty string when the code query param is not set", () => {
    // GIVEN: A location without a code query param
    const location = { search: "" }

    // WHEN getCodeQueryParam is called with the location
    const code = getCodeQueryParam(location)

    // THEN the code should be an empty string
    expect(code).toBe("")
  })
});
