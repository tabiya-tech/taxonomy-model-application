import {Handler, APIGatewayProxyEvent, Context, Callback} from "aws-lambda";
import {handler as InfoHandler} from "./info";
import {handler as ModelHandler } from "./modelInfo";
import {STD_ERRORS_RESPONSES} from "./server/httpUtils";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import {initOnce} from "./init";
import {getConfiguration} from "./server/config";


export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult>
  = async (event: APIGatewayProxyEvent, context, callback) => {
  try {
    // Initialize the application
    await initOnce(getConfiguration());

    // Handle routes
    return await handleRouteEvent(event, context, callback);
  } catch (e: unknown) {
    return STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR;
  }
};

export const handleRouteEvent
  = async (event: APIGatewayProxyEvent, context: Context, callback: Callback<APIGatewayProxyResult>) => {
  if (event.path === "/info") {
    return InfoHandler(event, context, callback);
  } else if (event.path === "/models") {
    return ModelHandler(event);
  }
  return STD_ERRORS_RESPONSES.NOT_FOUND;
};