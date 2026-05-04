import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import ErrorAPISpecs from "api-specifications/error";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import OccupationGroupGETAPISpecs from "api-specifications/esco/occupationGroup/GET";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance } from "validator";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ModelForOccupationGroupValidationErrorCode } from "../_shared/OccupationGroup.types";
import { IOccupationGroupService } from "../services/occupationGroup.service.type";
import { decodeCursor, encodeCursor, getOccupationGroupsPathParameters } from "./query";
import { transformPaginated } from "./response";

export class OccupationGroupListController {
  private readonly occupationGroupService: IOccupationGroupService;

  constructor() {
    this.occupationGroupService = getServiceRegistry().occupationGroup;
  }
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getOccupationGroups(event: APIGatewayProxyEvent) {
    try {
      const { modelId: resolvedModelId } = getOccupationGroupsPathParameters(event.path);
      if (!resolvedModelId) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          OccupationGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "modelId is missing in the path",
          JSON.stringify({ path: event.path, pathParameters: event.pathParameters, query: event.queryStringParameters })
        );
      }

      const requestPathParameter: OccupationGroupAPISpecs.GET.Types.Request.Param.Payload = {
        modelId: resolvedModelId,
      };

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupGETAPISpecs.Schemas.Request.Param.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.GET.Types.Request.Param.Payload>;

      const isValid = validatePathFunction(requestPathParameter);
      if (!isValid) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid modelId", path: event.path, pathParameters: event.pathParameters })
        );
      }

      const validationResult = await this.occupationGroupService.validateModelForOccupationGroup(
        requestPathParameter.modelId
      );
      if (validationResult === ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupGETAPISpecs.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationGroupGETAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
          "Failed to fetch the model details from the DB",
          ""
        );
      }

      const rawQueryParams = (event.queryStringParameters || {}) as { limit?: string; cursor?: string };
      const queryParams: OccupationGroupAPISpecs.GET.Types.Request.Query.Payload = {
        limit: rawQueryParams.limit ? Number.parseInt(rawQueryParams.limit, 10) : undefined,
        cursor: rawQueryParams.cursor,
      };

      const validateQueryFunction = ajvInstance.getSchema(
        OccupationGroupGETAPISpecs.Schemas.Request.Query.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.GET.Types.Request.Query.Payload>;
      const isQueryValid = validateQueryFunction(queryParams);
      if (!isQueryValid) {
        return errorResponseGET(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({ reason: "Invalid query parameters", path: event.path, query: event.queryStringParameters })
        );
      }

      let limit = 100;
      if (queryParams.limit) {
        limit = queryParams.limit;
      }

      let decodedCursor: { id: string; createdAt: Date } | undefined = undefined;
      if (queryParams.cursor) {
        try {
          decodedCursor = decodeCursor(queryParams.cursor);
        } catch (e: unknown) {
          console.error("Failed to decode cursor:", e);
          return errorResponseGET(
            StatusCodes.BAD_REQUEST,
            ErrorAPISpecs.Constants.GET.ErrorCodes.INVALID_QUERY_PARAMETER,
            "Invalid cursor parameter",
            ""
          );
        }
      }

      const currentPageOccupationGroups = await this.occupationGroupService.findPaginated(
        requestPathParameter.modelId,
        decodedCursor,
        limit
      );

      let nextCursor: string | null = null;
      if (currentPageOccupationGroups?.nextCursor?._id) {
        nextCursor = encodeCursor(
          currentPageOccupationGroups.nextCursor._id,
          currentPageOccupationGroups.nextCursor.createdAt
        );
      }
      return responseJSON(
        StatusCodes.OK,
        transformPaginated(currentPageOccupationGroups.items, getResourcesBaseUrl(), limit, nextCursor)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to retrieve occupation groups:", error);
      errorLoggerInstance.logError("Failed to retrieve the occupation groups from the DB", error.name);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupGETAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS,
        "Failed to retrieve the occupation groups from the DB",
        ""
      );
    }
  }
}
