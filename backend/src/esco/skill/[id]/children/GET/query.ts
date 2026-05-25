import { APIGatewayProxyEvent } from "aws-lambda";
import { parsePaginationQueryParams } from "../../../../occupations/_shared/pagination/parseQueryParams";

export function parseChildrenGETQuery(event: APIGatewayProxyEvent) {
  return parsePaginationQueryParams(event);
}
