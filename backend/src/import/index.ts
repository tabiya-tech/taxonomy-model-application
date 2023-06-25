import {APIGatewayProxyEvent} from "aws-lambda";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import {errorResponse, HTTP_VERBS, StatusCodes, STD_ERRORS_RESPONSES} from "server/httpUtils";
import {ajvInstance, ParseValidationError} from "validator";
import {ImportRequest, ImportRequestSchema, ImportResponseErrorCodes} from 'api-specifications/import';

import {ErrorCodes} from "api-specifications/error";

import {ValidateFunction} from "ajv";
import {lambda_invokeAsyncImport} from "./asyncImport";


export const handler: (event: APIGatewayProxyEvent/*, context: Context, callback: Callback*/)
  => Promise<APIGatewayProxyResult>
  = async (event: APIGatewayProxyEvent/*, context: Context, callback: Callback*/) => {

  //POST /triggerImport
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return postTriggerImport(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};


/**
 * @openapi
 *
 * /import:
 *     post:
 *       tags:
 *         - import
 *         - model
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/components/schemas/ImportRequestSchema'
 *         required: true
 *       responses:
 *         '202':
 *           description: Successfully trigger import process
 *         '400':
 *           description: |
 *             Failed to process the  bad request.
 *             Further information can be found in the `message` of response body, which can have the following values:
 *              - `TRIGGER_IMPORT_COULD_NOT_VALIDATE`: One of the body parameter is invalid
 *              - `MALFORMED_BODY': body of request is malformed
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '/components/schemas/errorResponseSchema'
 *         '500':
 *           description: |
 *             Server failed to process the request.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '/components/schemas/errorResponseSchema'
 */

async function postTriggerImport(event: APIGatewayProxyEvent) {
  // @ts-ignore
  if (!event.headers || !event.headers['Content-Type'] || !event.headers['Content-Type'].includes('application/json')) { // application/json;charset=UTF-8
    return errorResponse(StatusCodes.UNSUPPORTED_MEDIA_TYPE, ErrorCodes.UNSUPPORTED_MEDIA_TYPE, "Content-Type should be application/json", "Received Content-Type:" + event.headers['Content-Type']);
  }

  let payload: ImportRequest;
  try {
    payload = JSON.parse(event.body as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return errorResponse(StatusCodes.BAD_REQUEST, ErrorCodes.MALFORMED_BODY, "Payload is malformed, it should be a valid model json", error.message);
  }

  const validateFunction = ajvInstance.getSchema(ImportRequestSchema.$id as string) as ValidateFunction;
  const isValid = validateFunction(payload);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    return errorResponse(StatusCodes.BAD_REQUEST, ImportResponseErrorCodes.TRIGGER_IMPORT_COULD_NOT_VALIDATE,
      "Payload should conform to schema", errorDetail);
  }
  return lambda_invokeAsyncImport(payload);
}
