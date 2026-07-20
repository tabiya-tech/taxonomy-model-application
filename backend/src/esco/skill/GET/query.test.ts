import "_test_utilities/consoleMock";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import SkillAPISpecs from "api-specifications/esco/skill";
import { EmbeddableField } from "embeddings/service/types";
import { parseGETQuery, IParsedSkillGETQuery } from "./query";
import { encodeSearchCursor } from "../_shared/searchCursor";

function givenEvent(queryStringParameters: Record<string, string> | null): APIGatewayProxyEvent {
  return { queryStringParameters } as unknown as APIGatewayProxyEvent;
}

describe("parseGETQuery (skills) unit tests", () => {
  describe("pagination parameters", () => {
    test("should return the default limit and no search when no parameters are given", () => {
      // GIVEN an event with no query string parameters
      const givenEventNoParams = givenEvent(null);

      // WHEN the query is parsed
      const actual = parseGETQuery(givenEventNoParams) as IParsedSkillGETQuery;

      // THEN expect the default limit, no search value and the default searchFields
      expect(actual.limit).toBe(SkillAPISpecs.Constants.DEFAULT_LIMIT);
      expect(actual.searchValue).toBeUndefined();
      expect(actual.searchFields).toEqual([EmbeddableField.preferredLabel]);
    });

    test("should return the given limit and cursor", () => {
      // GIVEN an event with a valid limit and cursor
      const givenCursor = Buffer.from(
        JSON.stringify({ id: getMockStringId(1), createdAt: new Date().toISOString() })
      ).toString("base64");
      const givenValidEvent = givenEvent({ limit: "25", cursor: givenCursor });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenValidEvent) as IParsedSkillGETQuery;

      // THEN expect the parsed limit
      expect(actual.limit).toBe(25);
      expect(actual.searchValue).toBeUndefined();
    });

    test("should return a BAD_REQUEST response for an invalid limit", () => {
      // GIVEN an event with a non-numeric limit
      const givenInvalidEvent = givenEvent({ limit: "not-a-number" });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenInvalidEvent) as APIGatewayProxyResult;

      // THEN expect a BAD_REQUEST response
      expect(actual.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });

    test("should return a BAD_REQUEST response for a malformed cursor", () => {
      // GIVEN an event with a cursor that is not valid base64 JSON
      const givenInvalidEvent = givenEvent({ cursor: "not-base64-json-!@#$%" });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenInvalidEvent) as APIGatewayProxyResult;

      // THEN expect a BAD_REQUEST response
      expect(actual.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actual.body).errorCode).toBeDefined();
    });

    test("should accept a valid vector-search (relevance offset) cursor", () => {
      // GIVEN an event with a valid vector-search cursor (an offset, not a keyset id/createdAt token)
      const givenSearchCursor = encodeSearchCursor(10);
      const givenValidEvent = givenEvent({ query: "python", cursor: givenSearchCursor });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenValidEvent);

      // THEN expect it to be accepted (not a BAD_REQUEST error response)
      expect(actual).not.toHaveProperty("statusCode");
      expect((actual as IParsedSkillGETQuery).searchValue).toBe("python");
    });

    test("should return a BAD_REQUEST response for a cursor that is neither a keyset nor a search cursor", () => {
      // GIVEN an event with a well-formed base64 JSON token that is neither a keyset cursor nor a search cursor
      const givenBogusCursor = Buffer.from(JSON.stringify({ foo: "bar" })).toString("base64");
      const givenInvalidEvent = givenEvent({ cursor: givenBogusCursor });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenInvalidEvent) as APIGatewayProxyResult;

      // THEN expect a BAD_REQUEST response
      expect(actual.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe("search parameters", () => {
    test("should return the search value and default searchFields when only query is given", () => {
      // GIVEN an event with a query and no searchFields
      const givenSearchEvent = givenEvent({ query: "python developer" });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenSearchEvent) as IParsedSkillGETQuery;

      // THEN expect the search value and the default searchFields
      expect(actual.searchValue).toBe("python developer");
      expect(actual.searchFields).toEqual([EmbeddableField.preferredLabel]);
    });

    test("should parse a comma-separated searchFields into an array", () => {
      // GIVEN an event with a query and multiple searchFields
      const givenSearchEvent = givenEvent({ query: "python", searchFields: "preferredLabel,description,altLabels" });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenSearchEvent) as IParsedSkillGETQuery;

      // THEN expect the searchFields to be split into the corresponding EmbeddableField values
      expect(actual.searchValue).toBe("python");
      expect(actual.searchFields).toEqual([
        EmbeddableField.preferredLabel,
        EmbeddableField.description,
        EmbeddableField.altLabels,
      ]);
    });

    test("should return a BAD_REQUEST response for an unknown searchFields value", () => {
      // GIVEN an event with a query and an unknown searchFields value
      const givenInvalidEvent = givenEvent({ query: "python", searchFields: "notAField" });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenInvalidEvent) as APIGatewayProxyResult;

      // THEN expect a BAD_REQUEST response
      expect(actual.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });

    test("should return a BAD_REQUEST response when searchFields is given without a query", () => {
      // GIVEN an event with searchFields but no query
      const givenInvalidEvent = givenEvent({ searchFields: "preferredLabel" });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenInvalidEvent) as APIGatewayProxyResult;

      // THEN expect a BAD_REQUEST response
      expect(actual.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
  });
});
