import {APIGatewayProxyEvent} from "aws-lambda";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import {HTTP_VERBS, responseJSON, StatusCodes, STD_ERRORS_RESPONSES} from "server/httpUtils";
import {randomUUID} from "crypto";
import {EXPIRES, MAX_FILE_SIZE} from "./presigned.constants";

import {getUploadBucketName, getUploadBucketRegion} from "server/config/config";
import {s3_getPresignedPost} from "./awsSDKService";
import {transformPresignedPostDataToResponse} from "./transform";

export const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
  = async (event: APIGatewayProxyEvent) => {

  //GET /presigned
  if (event?.httpMethod === HTTP_VERBS.GET) {
    return await getPreSigned();
  }

  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

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
 *       security: []
 *       responses:
 *         200:
 *           description: Successfully created the presigned url.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/PresignedResponseSchema'
 *         500:
 *           $ref: '#/components/responses/InternalServerErrorResponse'
 */
export const getPreSigned = async () => {
  try {
    const folder = randomUUID();
    const postData = await s3_getPresignedPost(getUploadBucketRegion(), getUploadBucketName(), folder, MAX_FILE_SIZE, EXPIRES);
    return responseJSON(StatusCodes.OK, transformPresignedPostDataToResponse(postData, folder));
  } catch (e: unknown) {
    return STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR;
  }
};