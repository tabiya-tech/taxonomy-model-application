import {Context, Callback, APIGatewayProxyEvent} from "aws-lambda";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import version from './version.json';
import {HTTP_VERBS, responseJSON, STD_ERRORS_RESPONSES} from "server/httpUtils";
import {getResourcesBaseUrl} from "server/config/config";
import {getConnectionManager} from "server/connection/connectionManager";

export const handler: (event: APIGatewayProxyEvent, context: Context, callback: Callback)
  => Promise<APIGatewayProxyResult>
  = async (event: APIGatewayProxyEvent/*, context: Context, callback: Callback*/) => {

  if (event?.httpMethod === HTTP_VERBS.GET) {
    const dbConnection  = getConnectionManager().getCurrentDBConnection();
    return responseJSON(200, {
      ...version,
      path: `${getResourcesBaseUrl()}${event.path}`,
      database: dbConnection?.readyState === 1 ? "connected" : "not connected"
    });
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};
