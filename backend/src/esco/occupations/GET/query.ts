import { APIGatewayProxyEvent } from "aws-lambda";
import { parsePaginationQueryParams } from "../_shared/pagination/parseQueryParams";

export function parseGETQuery(event: APIGatewayProxyEvent) {
  return parsePaginationQueryParams(event);
}
