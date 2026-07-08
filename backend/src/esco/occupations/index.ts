import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { HTTP_VERBS, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { Routes } from "routes.constant";
import { pathToRegexp } from "path-to-regexp";

import { handler as getHandler } from "./GET/index";
import { handler as postHandler } from "./POST/index";
import { handler as getByIdHandler } from "./[id]/GET/index";
import { handler as getParentHandler } from "./[id]/parent/GET/index";
import { handler as postParentHandler } from "./[id]/parent/POST/index";
import { handler as getChildrenHandler } from "./[id]/children/GET/index";
import { handler as getSkillsHandler } from "./[id]/skills/GET/index";
import { handler as postSkillsHandler } from "./[id]/skills/POST/index";
import { handler as putByIdHandler } from "./[id]/PUT/index";
import { handler as patchByIdHandler } from "./[id]/PATCH/index";

export const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent
) => {
  if (event?.httpMethod === HTTP_VERBS.POST) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.OCCUPATION_PARENT_ROUTE).regexp.exec(pathToMatch)) {
      return postParentHandler(event);
    } else if (pathToRegexp(Routes.OCCUPATION_SKILLS_ROUTE).regexp.exec(pathToMatch)) {
      return postSkillsHandler(event);
    } else {
      return postHandler(event);
    }
  } else if (event?.httpMethod == HTTP_VERBS.GET) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.OCCUPATION_PARENT_ROUTE).regexp.exec(pathToMatch)) {
      return getParentHandler(event);
    } else if (pathToRegexp(Routes.OCCUPATION_CHILDREN_ROUTE).regexp.exec(pathToMatch)) {
      return getChildrenHandler(event);
    } else if (pathToRegexp(Routes.OCCUPATION_SKILLS_ROUTE).regexp.exec(pathToMatch)) {
      return getSkillsHandler(event);
    } else if (pathToRegexp(Routes.OCCUPATION_ROUTE).regexp.exec(pathToMatch)) {
      return getByIdHandler(event);
    } else {
      return getHandler(event);
    }
  } else if (event?.httpMethod === HTTP_VERBS.PUT) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.OCCUPATION_ROUTE).regexp.exec(pathToMatch)) {
      return putByIdHandler(event);
    }
  } else if (event?.httpMethod === HTTP_VERBS.PATCH) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.OCCUPATION_ROUTE).regexp.exec(pathToMatch)) {
      return patchByIdHandler(event);
    }
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};
