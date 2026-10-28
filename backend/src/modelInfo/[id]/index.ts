import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { HTTP_VERBS, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { ModelPATCHHandler } from "./PATCH";
import { ModelGETHandler } from "./GET";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  if (event?.httpMethod === HTTP_VERBS.GET) {
    return new ModelGETHandler().handle(event);
  } else if (event?.httpMethod === HTTP_VERBS.PATCH) {
    return new ModelPATCHHandler().handle(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};
