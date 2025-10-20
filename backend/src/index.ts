import { Handler, APIGatewayProxyEvent } from "aws-lambda";
import { handler as InfoHandler } from "applicationInfo";
import { handler as ModelHandler } from "modelInfo";
import { handler as ImportHandler } from "import";
import { handler as OccupationGroupHandler } from "esco/occupationGroup";
import { handler as OccupationHandler } from "esco/occupations";
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

export const handleRouteEvent = async (event: APIGatewayProxyEvent) => {
  const stage = event.requestContext?.stage ? `/${event.requestContext.stage}` : "";
  const rawPath = event.path || "";
  const path = rawPath.startsWith(stage) ? rawPath.slice(stage.length) || "/" : rawPath;

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
  } else if (pathToRegexp(Routes.OCCUPATION_GROUP_ROUTE).regexp.test(path)) {
    return OccupationGroupHandler(event);
  } else if (pathToRegexp(Routes.OCCUPATION_GROUPS_ROUTE).regexp.test(path)) {
    return OccupationGroupHandler(event);
  } else if (Routes.OCCUPATIONS_ROUTE.test(path) || Routes.OCCUPATION_BY_ID_ROUTE.test(path)) {
    return OccupationHandler(event);
  }
  return STD_ERRORS_RESPONSES.NOT_FOUND;
};
