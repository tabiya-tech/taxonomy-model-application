import {APIGatewayProxyEvent} from "aws-lambda";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import {errorResponse, HTTP_VERBS, StatusCodes, STD_ERRORS_RESPONSES} from "server/httpUtils";
import {ajvInstance, ParseValidationError} from "validator";
import Import from 'api-specifications/import';
import APIError from "api-specifications/error";

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
 *       operationId: PostImport
 *       tags:
 *         - import
 *       summary: Trigger the import process.
 *       description: Asynchronously trigger the import process for a given model.
 *       security: []
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportSchema'
 *         required: true
 *       responses:
 *         '202':
 *           description: Import process was successfully triggered. The import process is running asynchronously.
 *         '400':
 *           description: |
 *             Failed to trigger the import process. Additional information can be found in the response body.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorSchema'
 *         '415':
 *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
 *         '500':
 *           $ref: '#/components/responses/InternalServerErrorResponse'
 */

async function postTriggerImport(event: APIGatewayProxyEvent) {
  // @ts-ignore
  if (!event.headers['Content-Type']?.includes('application/json')) { //  application/json;charset=UTF-8
    return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
  }
  
  // @ts-ignore
  if(event.body?.length > Import.Constants.MAX_PAYLOAD_LENGTH){
    return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(`Expected maximum length is ${Import.Constants.MAX_PAYLOAD_LENGTH}` );
  }

  let payload: Import.POST.Request.Payload;
  try {
    payload = JSON.parse(event.body as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return errorResponse(StatusCodes.BAD_REQUEST, APIError.Constants.ErrorCodes.MALFORMED_BODY, "Payload is malformed, it should be a valid model json", error.message);
  }

  const validateFunction = ajvInstance.getSchema(Import.POST.Request.Schema.$id as string) as ValidateFunction;
  const isValid = validateFunction(payload);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
  }
  return lambda_invokeAsyncImport(payload);
}
