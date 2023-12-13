import { Handler, APIGatewayProxyEvent } from "aws-lambda";
import { handler as InfoHandler } from "applicationInfo";
import { handler as ModelHandler } from "modelInfo";
import { handler as ImportHandler } from "import";
import { STD_ERRORS_RESPONSES } from "server/httpUtils";
import { handler as presignedHandler } from "presigned";
import { handler as ExportHandler } from "export";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { initOnce } from "server/init";
import { Routes } from "routes.constant";

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event: APIGatewayProxyEvent) => {
  try {
    // Initialize the application
    await initOnce();

    // Handle routes
    return await handleRouteEvent(event);
  } catch (e: unknown) {
    console.error(new Error("An Error occurred while routing.", { cause: e }));
    return STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR;
  }
};

export const handleRouteEvent = async (event: APIGatewayProxyEvent) => {
  if (event.path === Routes.APPLICATION_INFO_ROUTE) {
    return InfoHandler(event);
  } else if (event.path === Routes.MODELS_ROUTE) {
    return ModelHandler(event);
  } else if (event.path === Routes.PRESIGNED_ROUTE) {
    return presignedHandler(event);
  } else if (event.path === Routes.IMPORT_ROUTE) {
    return ImportHandler(event);
  } else if (event.path === Routes.EXPORT_ROUTE) {
    return ExportHandler(event);
  }
  return STD_ERRORS_RESPONSES.NOT_FOUND;
};
