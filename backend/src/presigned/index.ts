import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { HTTP_VERBS, responseJSON, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { randomUUID } from "crypto";
import PresignedAPISpecs from "api-specifications/presigned";

import { getUploadBucketName, getUploadBucketRegion } from "server/config/config";
import { s3_getPresignedPost } from "./awsSDKService";
import { transformPresignedPostDataToResponse } from "./transform";
import { RoleRequired } from "../auth/authenticator";
import AuthAPISpecs from "api-specifications/auth";

export const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent
) => {
  const controller = new PresignedController();
  //GET /presigned
  if (event?.httpMethod === HTTP_VERBS.GET) {
    return await controller.getPreSigned(event);
  }

  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

export class PresignedController {
  /**
   * @openapi
   *
   * /presigned:
   *     get:
   *       operationId: GetPresignedUrl
   *       tags:
   *         - import
   *       summary: Get a presigned url that can be used to upload files to the import.
   *       description: |
   *         Returns a presigned url that can be used to upload files to the import. There url expires after 1 hour. The maximum file size is 10 MB.
   *       security:
   *         - jwt_auth: []
   *       responses:
   *         200:
   *           description: Successfully created the presigned url.
   *           content:
   *             application/json:
   *               schema:
   *                 $ref: '#/components/schemas/PresignedSchema'
   *         500:
   *           $ref: '#/components/responses/InternalServerErrorResponse'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPreSigned(event: APIGatewayProxyEvent) {
    try {
      const folder = randomUUID();
      const postData = await s3_getPresignedPost(
        getUploadBucketRegion(),
        getUploadBucketName(),
        folder,
        PresignedAPISpecs.Constants.MAX_FILE_SIZE,
        PresignedAPISpecs.Constants.EXPIRES
      );
      return responseJSON(StatusCodes.OK, transformPresignedPostDataToResponse(postData, folder));
    } catch (e: unknown) {
      return STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR;
    }
  }
}
