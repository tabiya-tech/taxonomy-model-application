import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, HTTP_VERBS, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { ajvInstance, ParseValidationError } from "validator";
import ImportAPISpecs from "api-specifications/import";
import ErrorAPISpecs from "api-specifications/error";

import { ValidateFunction } from "ajv";
import { lambda_invokeAsyncImport } from "./invokeAsyncImport";
import { RoleRequired } from "auth/authenticator";
import AuthAPISpecs from "api-specifications/auth";

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
 *       security:
 *        - jwt_auth: []
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
 *         '403':
 *           $ref: '#/components/responses/ForbiddenResponse'
 *         '415':
 *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
 *         '500':
 *           $ref: '#/components/responses/InternalServerErrorResponse'
 */

class ImportHandler {
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER) // Applying role-based access control
  async postTriggerImport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    if (!event.headers["Content-Type"]?.includes("application/json")) {
      return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
    }

    if (event.body?.length && event.body.length > ImportAPISpecs.Constants.MAX_PAYLOAD_LENGTH) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${ImportAPISpecs.Constants.MAX_PAYLOAD_LENGTH}`
      );
    }

    let payload: ImportAPISpecs.Types.POST.Request.Payload;
    try {
      payload = JSON.parse(event.body as string);
    } catch (error: unknown) {
      return errorResponse(
        StatusCodes.BAD_REQUEST,
        ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY,
        "Payload is malformed, it should be a valid model json",
        // @ts-ignore
        error.message
      );
    }

    const validateFunction = ajvInstance.getSchema(
      ImportAPISpecs.Schemas.POST.Request.Payload.$id as string
    ) as ValidateFunction;
    const isValid = validateFunction(payload);
    if (!isValid) {
      const errorDetail = ParseValidationError(validateFunction.errors);
      return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
    }

    return lambda_invokeAsyncImport(payload);
  }
}

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  //POST /triggerImport
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return new ImportHandler().postTriggerImport(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};
