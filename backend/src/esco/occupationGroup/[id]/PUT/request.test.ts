import "_test_utilities/consoleMock";

import { APIGatewayProxyEvent } from "aws-lambda";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import ErrorAPISpecs from "api-specifications/error";
import { randomUUID } from "crypto";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { parseAndValidatePUTRequest } from "./request";

const MAX_LENGTH = OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH;

function getGivenPayload(): OccupationGroupAPISpecs.OccupationGroup.PUT.Types.Request.Payload {
  return {
    modelId: getMockStringId(1),
    code: "1234",
    groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
    preferredLabel: { en: "Managers" },
    description: { en: "A description" },
    altLabels: [{ en: "Executives" }],
    originUri: "https://example.com",
    UUIDHistory: [randomUUID()],
  };
}

function buildEvent(body: unknown): APIGatewayProxyEvent {
  return { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } as never;
}

describe("Test parseAndValidatePUTRequest()", () => {
  test.each([
    ["a single language payload", {}],
    [
      "a multi language payload",
      {
        preferredLabel: { en: "Managers", fr: "Directeurs" },
        description: { en: "A description", fr: "Une description" },
        altLabels: [{ en: "Executives", fr: "Cadres" }],
      },
    ],
  ])("should return the payload when it is %s", (_description, givenOverrides) => {
    // GIVEN a valid payload
    const givenPayload = { ...getGivenPayload(), ...givenOverrides };

    // WHEN parsing and validating the request
    const actual = parseAndValidatePUTRequest(buildEvent(givenPayload));

    // THEN expect the payload to be returned as is
    expect(actual).toEqual(givenPayload);
  });

  test.each([
    [
      "uses a language that is not in the registry",
      { preferredLabel: { en: "Managers", tlh: "nuqneH" } },
      "/preferredLabel",
    ],
    [
      "has a value longer than the maximum length in one language only",
      { preferredLabel: { en: "Managers", fr: "a".repeat(MAX_LENGTH + 1) } },
      "/preferredLabel/fr",
    ],
    ["omits the fallback language", { preferredLabel: { fr: "Directeurs" } }, "/preferredLabel"],
    ["deletes the fallback language via null", { preferredLabel: { en: null } }, "/preferredLabel/en"],
  ])("should respond with BAD_REQUEST when the payload %s", (_description, givenOverrides, expectedPath) => {
    // GIVEN an invalid payload
    const givenPayload = { ...getGivenPayload(), ...givenOverrides };

    // WHEN parsing and validating the request
    const actual = parseAndValidatePUTRequest(buildEvent(givenPayload));

    // THEN expect BAD_REQUEST
    expect(actual).toHaveProperty("statusCode", StatusCodes.BAD_REQUEST);
    // AND the error details to name the field and the language
    const actualBody: ErrorAPISpecs.Types.Payload = JSON.parse((actual as { body: string }).body);
    expect(actualBody.errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    expect(actualBody.details).toContain(expectedPath);
  });

  test("should respond with BAD_REQUEST when code does not match the groupType, with an unchanged message", () => {
    // GIVEN a payload whose code is a local group code while groupType is ISCOGroup
    const givenPayload = { ...getGivenPayload(), code: "a1" };

    // WHEN parsing and validating the request
    const actual = parseAndValidatePUTRequest(buildEvent(givenPayload));

    // THEN expect BAD_REQUEST with the code pattern error
    const actualBody: ErrorAPISpecs.Types.Payload = JSON.parse((actual as { body: string }).body);
    expect(actualBody.details).toContain(
      `/code must match pattern "${OccupationGroupAPISpecs.Patterns.Str.ISCO_GROUP_CODE}"`
    );
  });
});
