import { buildParentResponse } from "./response";

describe("Parent GET Response Coverage", () => {
  test("buildParentResponse should return null if parent is null", () => {
    const result = buildParentResponse(null, "http://base.url");
    expect(result).toBeNull();
  });
});
