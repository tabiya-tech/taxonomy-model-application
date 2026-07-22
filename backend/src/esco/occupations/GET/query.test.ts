import "_test_utilities/consoleMock";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { EmbeddableField } from "embeddings/service/types";
import { parseGETQuery, IParsedOccupationGETQuery } from "./query";
import { encodeSearchCursor } from "esco/common/searchCursor";

function givenEvent(queryStringParameters: Record<string, string> | null): APIGatewayProxyEvent {
  return { queryStringParameters } as unknown as APIGatewayProxyEvent;
}

describe("parseGETQuery (occupations) unit tests", () => {
  describe("pagination parameters", () => {
    test("should return the default limit and no search when no parameters are given", () => {
      // GIVEN an event with no query string parameters
      const givenEventNoParams = givenEvent(null);

      // WHEN the query is parsed
      const actual = parseGETQuery(givenEventNoParams) as IParsedOccupationGETQuery;

      // THEN expect the default limit, no search value and the default searchFields
      expect(actual.limit).toBe(OccupationAPISpecs.Constants.DEFAULT_LIMIT);
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
      const actual = parseGETQuery(givenValidEvent) as IParsedOccupationGETQuery;

      // THEN expect the parsed limit and no search value
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
      const givenValidEvent = givenEvent({ query: "software", cursor: givenSearchCursor });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenValidEvent);

      // THEN expect it to be accepted (not a BAD_REQUEST error response)
      expect(actual).not.toHaveProperty("statusCode");
      expect((actual as IParsedOccupationGETQuery).searchValue).toBe("software");
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
      const givenSearchEvent = givenEvent({ query: "software developer" });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenSearchEvent) as IParsedOccupationGETQuery;

      // THEN expect the search value and the default searchFields
      expect(actual.searchValue).toBe("software developer");
      expect(actual.searchFields).toEqual([EmbeddableField.preferredLabel]);
    });

    test("should parse a comma-separated searchFields into an array", () => {
      // GIVEN an event with a query and multiple searchFields
      const givenSearchEvent = givenEvent({ query: "software", searchFields: "preferredLabel,description,altLabels" });

      // WHEN the query is parsed
      const actual = parseGETQuery(givenSearchEvent) as IParsedOccupationGETQuery;

      // THEN expect the searchFields to be split into the corresponding EmbeddableField values
      expect(actual.searchValue).toBe("software");
      expect(actual.searchFields).toEqual([
        EmbeddableField.preferredLabel,
        EmbeddableField.description,
        EmbeddableField.altLabels,
      ]);
    });

    test("should return a BAD_REQUEST response for an unknown searchFields value", () => {
      // GIVEN an event with a query and an unknown searchFields value
      const givenInvalidEvent = givenEvent({ query: "software", searchFields: "notAField" });

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
