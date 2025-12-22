import { APIGatewayProxyEvent, Handler } from "aws-lambda";
import { handler as InfoHandler } from "applicationInfo";
import { handler as ModelHandler } from "modelInfo";
import { handler as ImportHandler } from "import";
import { handler as OccupationGroupHandler } from "esco/occupationGroup/index";
import { handler as OccupationHandler } from "esco/occupations";
import { handler as SkillGroupHandler } from "esco/skillGroup/index";
import { handler as SkillHandler } from "esco/skill/index";
import { STD_ERRORS_RESPONSES } from "server/httpUtils";
import { handler as presignedHandler } from "presigned";
import { handler as ExportHandler } from "export";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { initOnce } from "server/init";
import { Routes } from "routes.constant";
import { initializeSentry } from "initializeSentry";
import * as Sentry from "@sentry/aws-serverless";
import { Lambdas } from "common/lambda.types";
import { pathToRegexp } from "path-to-regexp";

initializeSentry(Lambdas.API);

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = Sentry.wrapHandler(
  async (event: APIGatewayProxyEvent) => {
    try {
      // Initialize the application
      await initOnce();

      // Handle routes
      return await handleRouteEvent(event);
    } catch (e: unknown) {
      console.error(e);
      return STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR;
    }
  }
);

function getPath(event: APIGatewayProxyEvent): string {
  // Since the Function can be deployed under a proxy e.g. /api/partner/{proxy+}
  // If it is the case, then use only the proxy path.
  const proxyPath = event.pathParameters?.proxy;
  if (proxyPath) {
    // NOTE: We are deep updating the event.path here for further usage in the handlers.
    //       Since the question of the infrastructure should not be knowledge of handlers.
    const path = `/${proxyPath}`;
    event.path = path;
    return path;
  }

  const stage = event.requestContext?.stage ? `/${event.requestContext.stage}` : "";
  const rawPath = event.path || "";

  return rawPath.startsWith(stage) ? rawPath.slice(stage.length) || "/" : rawPath;
}

export const handleRouteEvent = async (event: APIGatewayProxyEvent) => {
  const path = getPath(event);

  if (path === Routes.APPLICATION_INFO_ROUTE) {
    return InfoHandler(event);
  } else if (path === Routes.MODELS_ROUTE) {
    return ModelHandler(event);
  } else if (path === Routes.PRESIGNED_ROUTE) {
    return presignedHandler(event);
  } else if (path === Routes.IMPORT_ROUTE) {
    return ImportHandler(event);
  } else if (path === Routes.EXPORT_ROUTE) {
    return ExportHandler(event);
  } else if (
    pathToRegexp([
      Routes.OCCUPATION_GROUPS_ROUTE,
      Routes.OCCUPATION_GROUP_ROUTE,
      Routes.OCCUPATION_GROUP_PARENT_ROUTE,
      Routes.OCCUPATION_GROUP_CHILDREN_ROUTE,
    ]).regexp.test(path)
  ) {
    return OccupationGroupHandler(event);
  } else if (pathToRegexp(Routes.OCCUPATIONS_ROUTE).regexp.test(path)) {
    return OccupationHandler(event);
  } else if (pathToRegexp(Routes.OCCUPATION_ROUTE).regexp.test(path)) {
    return OccupationHandler(event);
  } else if (pathToRegexp(Routes.SKILL_GROUPS_ROUTE).regexp.test(path)) {
    return SkillGroupHandler(event);
  } else if (pathToRegexp(Routes.SKILL_GROUP_ROUTE).regexp.test(path)) {
    return SkillGroupHandler(event);
  } else if (pathToRegexp(Routes.SKILLS_ROUTE).regexp.test(path)) {
    return SkillHandler(event);
  } else if (pathToRegexp(Routes.SKILL_ROUTE).regexp.test(path)) {
    return SkillHandler(event);
  }

  console.warn(`No handler found for path ${path}`, {
    eventPath: event.path,
    eventProxyPath: event.pathParameters?.proxy,
  });

  return STD_ERRORS_RESPONSES.NOT_FOUND;
};
