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
import {ajvInstance, ParseValidationError} from "../validator";
import {
  IModelInfoRequest,
  ModelInfoRequestSchema,
  ModelInfoResponseErrorCodes
} from 'api-specifications/modelInfo';

import {ErrorCodes} from "api-specifications/error";

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
 *       tags:
 *         - model
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '/components/schemas/modelInfoRequestSchema'
 *         required: true
 *       responses:
 *         '201':
 *           description: Successfully created the model
 *           content:
 *             application/json:
 *               schema:
 *                  $ref: '/components/schemas/modelInfoResponseSchema'
 *         '400':
 *           description: |
 *             Failed to process the  bad request.
 *             Further information can be found in the `message` of response body, which can have the following values:
 *              - `MODEL_COULD_NOT_VALIDATE`: One of the body parameter is invalid
 *              - `MALFORMED_BODY': body of request is malformed
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '/components/schemas/errorResponseSchema'
 *          '415':
 *           description: |
 *             Failed to process the request with an invalid content type.
 *             Further information can be found in the `message` of response body, which can have the following values:
 *              - `UNSUPPORTED_MEDIA_TYPE`: The content type  should application/json
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '/components/schemas/errorResponseSchema'
 *         '500':
 *           description: |
 *             Server failed to process the request.
 *             Further information can be found in the `message` of response body, which can have the following values:
 *              - `MODEL_COULD_NOT_BE_CREATED`: the server is unable to create the request
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '/components/schemas/errorResponseSchema'
 */
async function postModelInfo(event: APIGatewayProxyEvent) {
  if (!event.headers['Content-Type'] || !event.headers['Content-Type'].includes('application/json')) { // application/json;charset=UTF-8
    return errorResponse(StatusCodes.UNSUPPORTED_MEDIA_TYPE, ErrorCodes.UNSUPPORTED_MEDIA_TYPE, "Content-Type should be application/json", "Received Content-Type:" + event.headers['Content-Type']);
  }
  let payload: IModelInfoRequest;
  try {
    payload = JSON.parse(event.body as string);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return errorResponse(StatusCodes.BAD_REQUEST, ErrorCodes.MALFORMED_BODY, "Payload is malformed, it should be a valid model json", error.message);
  }
  const validateFunction = ajvInstance.getSchema(ModelInfoRequestSchema.$id as string) as ValidateFunction;
  const isValid = validateFunction(payload);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    return errorResponse(StatusCodes.BAD_REQUEST, ModelInfoResponseErrorCodes.MODEL_COULD_NOT_VALIDATE, "Payload should conform to schema", errorDetail);
  }

  const newModelInfoSpec: INewModelInfoSpec = {
    name: payload.name,
    description: payload.description,
    locale: payload.locale
  };
  let newModelInfo: IModelInfo;
  try {
    newModelInfo = await getRepositoryRegistry().modelInfo.create(newModelInfoSpec);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {  //
    // Do not show the error message to the user as it can contain sensitive information such as DB connection string
    return errorResponse(StatusCodes.INTERNAL_SERVER_ERROR, ModelInfoResponseErrorCodes.DB_FAILED_TO_CREATE_MODEL, "Failed to create the model in the DB", "");
  }
  return responseJSON(StatusCodes.CREATED, transform(newModelInfo, getResourcesBaseUrl()));
}


