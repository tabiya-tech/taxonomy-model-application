import { APIGatewayProxyEvent } from "aws-lambda";
import { parsePaginationQueryParams } from "../../../../occupations/_shared/pagination/parseQueryParams";

export function parseOccupationsGETQuery(event: APIGatewayProxyEvent) {
  return parsePaginationQueryParams(event);
}
