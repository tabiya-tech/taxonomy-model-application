import {APIGatewayProxyEvent} from "aws-lambda";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import {
  errorResponse,
  HTTP_VERBS,
  responseJSON,
  StatusCodes,
  STD_ERRORS_RESPONSES
} from "server/httpUtils";
import {IModelInfo, INewModelInfoSpec} from "./modelInfoModel";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {ajvInstance, ParseValidationError} from "validator";
import {
  IModelInfoRequest, MAX_PAYLOAD_LENGTH,
  ModelInfoRequestSchema,
  ModelInfoResponseErrorCodes
} from 'api-specifications/modelInfo';

import {ValidateFunction} from "ajv";
import {transform} from "./transform";
import {getResourcesBaseUrl} from "server/config/config";


export const handler: (event: APIGatewayProxyEvent/*, context: Context, callback: Callback*/)
  => Promise<APIGatewayProxyResult>
  = async (event: APIGatewayProxyEvent/*, context: Context, callback: Callback*/) => {
  //POST /modelInfo
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return postModelInfo(event);
  }

  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

/**
 * @openapi
 *
 * /models:
 *     post:
 *       operationId: GetModel
 *       tags:
 *         - model
 *       summary: Create a new taxonomy model.
 *       description: Create a new taxonomy model that can be used to import data into it.
 *       security: []
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ModelInfoRequestSchema'
 *         required: true
 *       responses:
 *         '201':
 *           description: Successfully created the model,
 *           content:
 *             application/json:
 *               schema:
 *                  $ref: '#/components/schemas/ModelInfoResponseSchema'
 *         '400':
 *           description: |
 *             Failed to create the model. Additional information can be found in the response body.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponseSchema'
 *         '415':
 *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
 *         '500':
 *           $ref: '#/components/responses/InternalServerErrorResponse'
 */
async function postModelInfo(event: APIGatewayProxyEvent) {
  if (!event.headers['Content-Type'] || !event.headers['Content-Type'].includes('application/json')) { // application/json;charset=UTF-8
    return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
  }


  // @ts-ignore
  if(event.body?.length > MAX_PAYLOAD_LENGTH){
    return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(`Expected maximum length is ${MAX_PAYLOAD_LENGTH}` );
  }

  let payload: IModelInfoRequest;
  try {
    payload = JSON.parse(event.body as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(error.message);
  }
  const validateFunction = ajvInstance.getSchema(ModelInfoRequestSchema.$id as string) as ValidateFunction;
  const isValid = validateFunction(payload);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
  }

  const newModelInfoSpec: INewModelInfoSpec = {
    name: payload.name,
    description: payload.description,
    locale: payload.locale
  };
  let newModelInfo: IModelInfo;
  try {
    newModelInfo = await getRepositoryRegistry().modelInfo.create(newModelInfoSpec);
    return responseJSON(StatusCodes.CREATED, transform(newModelInfo, getResourcesBaseUrl()));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {  //
    // Do not show the error message to the user as it can contain sensitive information such as DB connection string
    return errorResponse(StatusCodes.INTERNAL_SERVER_ERROR, ModelInfoResponseErrorCodes.DB_FAILED_TO_CREATE_MODEL, "Failed to create the model in the DB", "");
  }
}


