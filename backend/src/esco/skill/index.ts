import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HTTP_VERBS, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { Routes } from "routes.constant";
import { pathToRegexp } from "path-to-regexp";

import { handler as getHandler } from "./GET";
import { handler as postHandler } from "./POST";
import { handler as getByIdHandler } from "./[id]/GET";
import { handler as getParentsHandler } from "./[id]/parents/GET";
import { handler as postParentsHandler } from "./[id]/parents/POST";
import { handler as getChildrenHandler } from "./[id]/children/GET";
import { handler as getOccupationsHandler } from "./[id]/occupations/GET";
import { handler as postOccupationsHandler } from "./[id]/occupations/POST";
import { handler as getRelatedHandler } from "./[id]/related/GET";
import { handler as postRelatedHandler } from "./[id]/related/POST";

export const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent
) => {
  if (event?.httpMethod === HTTP_VERBS.POST) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.SKILL_PARENTS_ROUTE).regexp.exec(pathToMatch)) {
      return postParentsHandler(event);
    } else if (pathToRegexp(Routes.SKILL_OCCUPATIONS_ROUTE).regexp.exec(pathToMatch)) {
      return postOccupationsHandler(event);
    } else if (pathToRegexp(Routes.SKILL_RELATED_ROUTE).regexp.exec(pathToMatch)) {
      return postRelatedHandler(event);
    } else {
      return postHandler(event);
    }
  } else if (event?.httpMethod == HTTP_VERBS.GET) {
    const pathToMatch = event.path || "";
    if (pathToRegexp(Routes.SKILL_PARENTS_ROUTE).regexp.exec(pathToMatch)) {
      return getParentsHandler(event);
    } else if (pathToRegexp(Routes.SKILL_CHILDREN_ROUTE).regexp.exec(pathToMatch)) {
      return getChildrenHandler(event);
    } else if (pathToRegexp(Routes.SKILL_OCCUPATIONS_ROUTE).regexp.exec(pathToMatch)) {
      return getOccupationsHandler(event);
    } else if (pathToRegexp(Routes.SKILL_RELATED_ROUTE).regexp.exec(pathToMatch)) {
      return getRelatedHandler(event);
    } else {
      const individualMatch = pathToRegexp(Routes.SKILL_ROUTE).regexp.exec(pathToMatch);
      return individualMatch ? getByIdHandler(event) : getHandler(event);
    }
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};
