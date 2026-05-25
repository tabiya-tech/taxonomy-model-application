import { APIGatewayProxyEvent } from "aws-lambda";
import { parsePaginationQueryParams } from "../../occupations/_shared/pagination/parseQueryParams";

export function parseGETQuery(event: APIGatewayProxyEvent) {
  return parsePaginationQueryParams(event);
}
