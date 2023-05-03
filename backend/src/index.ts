import {Handler, APIGatewayProxyEvent, Context, Callback} from "aws-lambda";
import {handler as InfoHandler} from "./info";
import {STD_ERRORS_RESPONSES} from "./httpUtils";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult>
  = async (event: APIGatewayProxyEvent, context, callback) => {
  try {
    return await handleRouteEvent(event, context, callback);
  } catch (e) {
    return STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR;
  }
}

export const handleRouteEvent
  = async (event: APIGatewayProxyEvent, context: Context, callback: Callback<APIGatewayProxyResult>) => {
  if (event.path === "/info") {
    return InfoHandler(event, context, callback);
  }
  return STD_ERRORS_RESPONSES.NOT_FOUND;
}