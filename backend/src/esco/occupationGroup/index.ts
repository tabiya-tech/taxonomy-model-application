import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, HTTP_VERBS, responseJSON, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ajvInstance, ParseValidationError } from "validator";
import AuthAPISpecs from "api-specifications/auth";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { ValidateFunction } from "ajv";
import { transform, transformPaginated } from "./transform";
import { getResourcesBaseUrl } from "server/config/config";
import { IOccupationGroup, INewOccupationGroupSpec } from "./OccupationGroup.types";
import { RoleRequired } from "auth/authenticator";

export const handler: (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => Promise<APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent /*, context: Context, callback: Callback*/
) => {
  const occupationGroupController = new OccupationGroupController();
  //POST /occupationGroups
  if (event?.httpMethod === HTTP_VERBS.POST) {
    return occupationGroupController.postOccupationGroup(event);
  } else if (event?.httpMethod == HTTP_VERBS.GET) {
    return occupationGroupController.getOccupationGroups(event);
  }
  return STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED;
};

class OccupationGroupController {
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async postOccupationGroup(event: APIGatewayProxyEvent) {
    if (!event.headers["Content-Type"]?.includes("application/json")) {
      // application/json;charset=utf-8
      return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
    }

    //@ts-ignore
    if (event.body?.length > OccupationGroupAPISpecs.Constants.MAX_PAYLOAD_LENGTH) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${OccupationGroupAPISpecs.Constants.MAX_PAYLOAD_LENGTH}`
      );
    }

    let payload: OccupationGroupAPISpecs.Types.POST.Request.Payload;
    try {
      payload = JSON.parse(event.body as string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(error.message);
    }
    const validateFunction = ajvInstance.getSchema(
      OccupationGroupAPISpecs.Schemas.POST.Request.Payload.$id as string
    ) as ValidateFunction;

    const isValid = validateFunction(payload);
    if (!isValid) {
      const errorDetail = ParseValidationError(validateFunction.errors);
      return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
    }

    const newOccupationGroupSpec: INewOccupationGroupSpec = {
      originUri: payload.originUri,
      code: payload.code,
      description: payload.description,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      groupType: payload.groupType,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
      importId: null,
    };
    try {
      const newOccupationGroup = await getRepositoryRegistry().OccupationGroup.create(newOccupationGroupSpec);
      return responseJSON(StatusCodes.CREATED, transform(newOccupationGroup, getResourcesBaseUrl()));
    } catch (error: unknown) {
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.Enums.POST.Response.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        "Failed to create the occupation group in the DB",
        ""
      );
    }
  }
  async getOccupationGroups(event: APIGatewayProxyEvent) {
    // here is where the pagination decoding and pointing and also generating the base64 cursor for the next pagination and return it
    try {
      // extract the modelId from the pathParameters
      if (!event.pathParameters?.modelId) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "modelId is missing in the path",
          "modelId is required"
        );
      }
      const requestPathParameter = {
        modelId: event.pathParameters?.modelId,
      } as OccupationGroupAPISpecs.Types.GET.Request.Param.Payload;

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupAPISpecs.Schemas.GET.Request.Param.Payload.$id as string
      ) as ValidateFunction;
      const isValid = validatePathFunction(requestPathParameter);
      if (!isValid) {
        const errorDetail = ParseValidationError(validatePathFunction.errors);
        return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
      }

      const rawQueryParams = event.queryStringParameters || {};

      const queryParams = {
        limit: rawQueryParams.limit ? parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor,
      } as OccupationGroupAPISpecs.Types.GET.Request.Query.Payload;

      const validateQueryFunction = ajvInstance.getSchema(
        OccupationGroupAPISpecs.Schemas.GET.Request.Query.Payload.$id as string
      ) as ValidateFunction;
      const isQueryValid = validateQueryFunction(queryParams);
      if (!isQueryValid) {
        const errorDetail = ParseValidationError(validateQueryFunction.errors);
        return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
      }

      // extract the nextCursor and the limit from the query parameter
      let limit = 100;
      if (queryParams.limit) {
        limit = queryParams.limit;
        if (isNaN(limit) || limit <= 0) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_LIMIT_PARAMETER,
            "limit is invalid",
            "limit should be a positive integer"
          );
        }
      }
      // here decode the cursor base64
      let cursor: { id: string; createdAt: Date } | null = null;
      try {
        if (typeof queryParams.cursor === "string") {
          cursor = getRepositoryRegistry().OccupationGroup.decodeCursor(queryParams.cursor);
        } else if (queryParams.cursor !== undefined) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_NEXT_CURSOR_PARAMETER,
            "cursor is invalid",
            "cursor should be a valid base64 string"
          );
        }
      } catch (error: unknown) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_NEXT_CURSOR_PARAMETER,
          "cursor is invalid",
          "cursor should be a valid base64 string"
        );
      }

      if (!cursor?.id) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.INVALID_NEXT_CURSOR_PARAMETER,
          "cursor is invalid",
          "cursor should be a valid base64 string"
        );
      }
      // here call the repository to get the occupationGroup by limit starting from the cursor id field
      const currentPageOccupationGroups = await getRepositoryRegistry().OccupationGroup.findPaginated(
        requestPathParameter.modelId,
        cursor?.id,
        limit
      );
      const occupationGroups: IOccupationGroup[] = [];
      let nextCursor: string | null = null;
      for await (const data of currentPageOccupationGroups.stream) {
        occupationGroups.push(data);
      }

      if (currentPageOccupationGroups.nextCursor && currentPageOccupationGroups.nextCursor._id) {
        nextCursor = getRepositoryRegistry().OccupationGroup.encodeCursor(
          currentPageOccupationGroups.nextCursor._id,
          currentPageOccupationGroups.nextCursor.createdAt
        );
      }

      return responseJSON(
        StatusCodes.OK,
        transformPaginated(occupationGroups, getResourcesBaseUrl(), limit, nextCursor)
      );
    } catch (e: unknown) {
      // Do not show the error message to the user as it can contain sensitive information such as DB connection string
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.Enums.GET.Response.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        "Failed to retrieve the occupation groups from the DB",
        e instanceof Error ? e.message : ""
      );
    }
  }
}
