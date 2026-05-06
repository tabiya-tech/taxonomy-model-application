import { APIGatewayProxyEvent } from "aws-lambda";
import { parsePaginationQueryParams } from "../../../_shared/pagination/parseQueryParams";

export function parseChildrenQuery(event: APIGatewayProxyEvent) {
  return parsePaginationQueryParams(event);
}
