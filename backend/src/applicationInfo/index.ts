import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import version from "applicationInfo/version.json";
import { HTTP_VERBS, responseJSON, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { getResourcesBaseUrl } from "server/config/config";
import { getConnectionManager } from "server/connection/connectionManager";

/**
 * @openapi
 *
 * /info:
 *    get:
 *      operationId: GetInfo
 *      tags:
 *        - info
 *      summary: Get information about the deployed api.
 *      description: Retrieve information about the deployed api, including build details and database connection status.
 *      security: []
 *      responses:
 *        200:
 *          description: The deployed api information.
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/InfoSchema'
 *        500:
 *          $ref: '#/components/responses/InternalServerErrorResponse'
 */
export const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  if (event?.httpMethod === HTTP_VERBS.GET) {
    const dbConnection = getConnectionManager().getCurrentDBConnection();
    return responseJSON(200, {
      ...version,
      path: `${getResourcesBaseUrl()}${event.path}`,
      database: dbConnection?.readyState === 1 ? "connected" : "not connected",
    });
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};
