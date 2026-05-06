import { parsePaginationQueryParams } from "./parseQueryParams";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";

describe("parsePaginationQueryParams unit tests", () => {
  test("should return error response for invalid cursor", () => {
    const event = {
      queryStringParameters: {
        cursor: "invalid-base64-json-not-really-base64-!@#$%",
      },
    } as unknown as APIGatewayProxyEvent;

    const result = parsePaginationQueryParams(event) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(result.body).errorCode).toBeDefined();
  });

  test("should return valid pagination params for valid input", () => {
    const id = getMockStringId(1);
    const createdAt = new Date().toISOString();
    const cursor = Buffer.from(JSON.stringify({ id, createdAt })).toString("base64");
    const event = {
      queryStringParameters: {
        limit: "10",
        cursor: cursor,
      },
    } as unknown as APIGatewayProxyEvent;

    const result = parsePaginationQueryParams(event) as { limit: number; decodedCursor: string | undefined };
    expect(result.limit).toBe(10);
    expect(result.decodedCursor).toBe(id);
  });

  test("should return error response for invalid limit", () => {
    const event = {
      queryStringParameters: {
        limit: "foo",
      },
    } as unknown as APIGatewayProxyEvent;

    const result = parsePaginationQueryParams(event) as APIGatewayProxyResult;
    expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
  });
});
