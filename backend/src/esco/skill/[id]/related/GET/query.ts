import { APIGatewayProxyEvent } from "aws-lambda";
import { parsePaginationQueryParams } from "../../../../occupations/_shared/pagination/parseQueryParams";

export function parseRelatedGETQuery(event: APIGatewayProxyEvent) {
  return parsePaginationQueryParams(event);
}
