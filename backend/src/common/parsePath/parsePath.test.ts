import { parsePath } from "./parsePath";

describe("Parse Path", () => {
  test.each([
    {
      template: "/api/resource/:resourceId",
      input: "/api/resource/1",
      expected: {
        resourceId: "1",
      },
    },
    {
      template: "/api/resource/:resourceId/subresource/:subresourceId",
      input: "/api/resource/1/subresource/2",
      expected: {
        resourceId: "1",
        subresourceId: "2",
      },
    },
    {
      template: "/:base",
      input: "/api",
      expected: {
        base: "api",
      },
    },
  ])("should parse path template: $template and input: $input", ({ template, input, expected }) => {
    // GIVEN a template
    const givenTemplate = template;

    // AND given some input path
    const givenInput = input;

    // WHEN the template is parsed with the input path
    const result = parsePath(givenTemplate, givenInput);

    // THEN the result should match the expected output
    expect(result).toEqual(expected);
  });

  test("should return empty fields if they are not provided", () => {
    // GIVEN a template that does not match the input
    const givenTemplate = "/api/resource/:resourceId";

    // AND given some input path that does not match the template
    const givenInput = "/api/resource";

    // WHEN the template is parsed with the input path
    const result = parsePath(givenTemplate, givenInput);

    // THEN the result should match the expected output
    expect(result).toEqual({});
  });
});
