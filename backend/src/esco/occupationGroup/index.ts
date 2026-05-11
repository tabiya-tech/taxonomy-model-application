import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { HTTP_VERBS, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { Routes } from "routes.constant";
import { pathToRegexp } from "path-to-regexp";
import { handler as occupationGroupListHandler } from "./GET";
import { handler as occupationGroupCreateHandler } from "./POST";
import { handler as occupationGroupParentHandler } from "./[id]/parent/GET";
import { handler as occupationGroupChildrenHandler } from "./[id]/children/GET";
import { handler as occupationGroupDetailHandler } from "./[id]/GET";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return occupationGroupCreateHandler(event);
  } else if (event?.httpMethod === HTTP_VERBS.GET) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.OCCUPATION_GROUP_ROUTE).regexp.exec(pathToMatch)) {
      return occupationGroupDetailHandler(event);
    } else if (pathToRegexp(Routes.OCCUPATION_GROUP_PARENT_ROUTE).regexp.exec(pathToMatch)) {
      return occupationGroupParentHandler(event);
    } else if (pathToRegexp(Routes.OCCUPATION_GROUP_CHILDREN_ROUTE).regexp.exec(pathToMatch)) {
      return occupationGroupChildrenHandler(event);
    }
    return occupationGroupListHandler(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};
