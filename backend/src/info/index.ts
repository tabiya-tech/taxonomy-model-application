import {Context, Callback, APIGatewayProxyEvent} from "aws-lambda";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import version from './version.json';
import {HTTP_VERBS, response, STD_ERRORS_RESPONSES} from "httpUtils";

export const handler: (event: APIGatewayProxyEvent, context: Context, callback: Callback)
  => Promise<APIGatewayProxyResult>
  = async (event: APIGatewayProxyEvent, context: Context, callback: Callback) => {

  if (event?.httpMethod === HTTP_VERBS.GET) {
    return response(200, version);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
}
