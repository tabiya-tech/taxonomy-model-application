import { extractAndValidateIdParams } from "./params";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StatusCodes } from "server/httpUtils";
import ErrorAPISpecs from "api-specifications/error";

describe("params unit tests", () => {
  test("extractAndValidateIdParams should return error if path does not match route", () => {
    const givenEvent = {
      path: "/some/non/matching/path",
    } as APIGatewayProxyEvent;
    const givenRoute = "/models/:modelId/occupations/:id";

    const result = extractAndValidateIdParams(givenEvent, givenRoute);

    expect(result).toMatchObject({
      statusCode: StatusCodes.BAD_REQUEST,
    });
    const body = JSON.parse((result as APIGatewayProxyResult).body);
    expect(body.errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    expect(body.message).toEqual("Route did not match");
  });

  test("extractAndValidateIdParams should handle missing path", () => {
    const givenEvent = {
      path: null,
    } as unknown as APIGatewayProxyEvent;
    const givenRoute = "/models/:modelId/occupations/:id";

    const result = extractAndValidateIdParams(givenEvent, givenRoute);

    expect(result).toMatchObject({
      statusCode: StatusCodes.BAD_REQUEST,
    });
  });
});
