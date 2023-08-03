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
 *       tags:
 *         - presigned
 *       responses:
 *         '200':
 *           description: Successfully created the presigned url
 *           content:
 *             application/json:
 *               schema:
 *                  $ref: '/components/schemas/PreSignedResponseSchema'
 *         '500':
 *           description: |
 *             Server failed to process the request.
 *             Further information can be found in the `message` of response body, which can have the following values:
 *              - `INTERNAL_SERVER_ERROR`: the server is unable to create the presigned url
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '/components/schemas/errorResponseSchema'
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