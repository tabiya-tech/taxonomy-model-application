import { APIGatewayProxyEvent } from "aws-lambda";
import { parsePaginationQueryParams } from "../../../_shared/pagination/parseQueryParams";

export function parseSkillsQuery(event: APIGatewayProxyEvent) {
  return parsePaginationQueryParams(event);
}
