import { APIGatewayProxyEvent } from "aws-lambda";
import { errorResponse, HTTP_VERBS, responseJSON, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { ajvInstance, ParseValidationError } from "validator";
import { ValidateFunction } from "ajv";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ExportAPISpecs from "api-specifications/export";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  //POST /export
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return postTriggerExport(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

/**
 * @openapi
 *
 * /export:
 *     post:
 *       operationId: POSTExport
 *       tags:
 *         - export
 *       summary: Trigger the export process.
 *       description: Asynchronously trigger the export process for a given model.
 *       security: []
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportSchema'
 *         required: true
 *       responses:
 *         '201':
 *           description: Successfully triggered the export process.
 *         '400':
 *           description: |
 *             Failed to trigger the export process. Additional information can be found in the response body.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorSchema'
 *         '415':
 *           $ref: '#/components/responses/AcceptOnlyJSONResponse'
 *         '500':
 *           $ref: '#/components/responses/InternalServerErrorResponse'
 */
async function postTriggerExport(event: APIGatewayProxyEvent) {
  if (!event.headers["Content-Type"]?.includes("application/json")) {
    return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
  }

  if (!event.body) {
    return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR("Body is empty");
  }

  if (event.body.length > ExportAPISpecs.Constants.MAX_PAYLOAD_LENGTH) {
    return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
      `Expected maximum length is ${ExportAPISpecs.Constants.MAX_PAYLOAD_LENGTH}`
    );
  }

  let payload: ExportAPISpecs.Types.POST.Request.Payload;
  try {
    payload = JSON.parse(event.body);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(error.message);
  }

  const validateFunction = ajvInstance.getSchema(
    ExportAPISpecs.Schemas.POST.Request.Payload.$id as string
  ) as ValidateFunction;
  const isValid = validateFunction(payload);
  if (!isValid) {
    const errorDetail = ParseValidationError(validateFunction.errors);
    return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
  }
  try {
    await getRepositoryRegistry().exportProcessState.create({
      modelId: payload.modelId,
      status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "",
      timestamp: new Date(),
    });
    return responseJSON(StatusCodes.ACCEPTED, "");
  } catch (e: unknown) {
    return errorResponse(
      StatusCodes.INTERNAL_SERVER_ERROR,
      ExportAPISpecs.Enums.POST.Response.ExportResponseErrorCodes.FAILED_TO_TRIGGER_EXPORT,
      "Failed to trigger the export process",
      ""
    );
  }
}
