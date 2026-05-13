import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { HTTP_VERBS, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { Routes } from "routes.constant";
import { pathToRegexp } from "path-to-regexp";
import { handler as skillGroupListHandler } from "./GET";
import { handler as skillGroupDetailHandler } from "./[id]/GET";
import { handler as skillGroupParentsHandler } from "./[id]/parents/GET";
import { handler as skillGroupChildrenHandler } from "./[id]/children/GET";

export const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent
) => {
  if (event?.httpMethod === HTTP_VERBS.GET) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.SKILL_GROUP_ROUTE).regexp.exec(pathToMatch)) {
      return skillGroupDetailHandler(event);
    } else if (pathToRegexp(Routes.SKILL_GROUP_PARENTS_ROUTE).regexp.exec(pathToMatch)) {
      return skillGroupParentsHandler(event);
    } else if (pathToRegexp(Routes.SKILL_GROUP_CHILDREN_ROUTE).regexp.exec(pathToMatch)) {
      return skillGroupChildrenHandler(event);
    }
    return skillGroupListHandler(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};
