import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import OccupationGroupPOSTAPISpecs from "api-specifications/esco/occupationGroup/POST";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance, ParseValidationError } from "validator";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponsePOST, responseJSON, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import {
  INewOccupationGroupSpecWithoutImportId,
  ModelForOccupationGroupValidationErrorCode,
} from "../_shared/OccupationGroup.types";
import { parsePath } from "common/parsePath/parsePath";
import { Routes } from "routes.constant";
import { IOccupationGroupService, OccupationGroupModelValidationError } from "../services/occupationGroup.service.type";
import { transform } from "./response";

export class OccupationGroupCreateController {
  private readonly occupationGroupService: IOccupationGroupService;

  constructor() {
    this.occupationGroupService = getServiceRegistry().occupationGroup;
  }

  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async postOccupationGroup(event: APIGatewayProxyEvent) {
    if (!event.headers["Content-Type"]?.includes("application/json")) {
      return STD_ERRORS_RESPONSES.UNSUPPORTED_MEDIA_TYPE_ERROR;
    }

    //@ts-ignore
    if (event.body?.length > OccupationGroupAPISpecs.POST.Constants.MAX_POST_PAYLOAD_LENGTH) {
      return STD_ERRORS_RESPONSES.TOO_LARGE_PAYLOAD_ERROR(
        `Expected maximum length is ${OccupationGroupAPISpecs.POST.Constants.MAX_POST_PAYLOAD_LENGTH}`
      );
    }

    let payload: OccupationGroupAPISpecs.POST.Types.Request.Payload;

    try {
      payload = JSON.parse(event.body as string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return STD_ERRORS_RESPONSES.MALFORMED_BODY_ERROR(error.message);
    }

    const validateFunction = ajvInstance.getSchema(
      OccupationGroupPOSTAPISpecs.Schemas.Request.Payload.$id as string
    ) as ValidateFunction;

    const isValid = validateFunction(payload);
    if (!isValid) {
      const errorDetail = ParseValidationError(validateFunction.errors);
      return STD_ERRORS_RESPONSES.INVALID_JSON_SCHEMA_ERROR(errorDetail);
    }

    const { modelId: resolvedModelId } = parsePath<{ modelId?: string }>(Routes.OCCUPATION_GROUPS_ROUTE, event.path);
    if (!resolvedModelId) {
      return errorResponsePOST(
        StatusCodes.BAD_REQUEST,
        OccupationGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        "modelId is missing in the path",
        JSON.stringify({ path: event.path, pathParameters: event.pathParameters })
      );
    }

    if (payload.modelId !== resolvedModelId) {
      return errorResponsePOST(
        StatusCodes.BAD_REQUEST,
        OccupationGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        "modelId in payload does not match modelId in path",
        `Payload modelId: ${payload.modelId}, Path modelId: ${resolvedModelId}`
      );
    }

    const newOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId = {
      originUri: payload.originUri,
      code: payload.code,
      preferredLabel: payload.preferredLabel,
      altLabels: payload.altLabels,
      description: payload.description,
      modelId: payload.modelId,
      UUIDHistory: payload.UUIDHistory,
      groupType: payload.groupType,
    };

    try {
      const newOccupationGroup = await this.occupationGroupService.create(newOccupationGroupSpec);
      return responseJSON(StatusCodes.CREATED, transform(newOccupationGroup, getResourcesBaseUrl()));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      errorLoggerInstance.logError("Failed to create occupation group in the DB", error.name);
      if (error instanceof OccupationGroupModelValidationError) {
        switch (error.code) {
          case ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponsePOST(
              StatusCodes.NOT_FOUND,
              OccupationGroupPOSTAPISpecs.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB:
            return errorResponsePOST(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
              "Failed to fetch the model detail from the DB",
              ""
            );
          case ModelForOccupationGroupValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponsePOST(
              StatusCodes.BAD_REQUEST,
              OccupationGroupPOSTAPISpecs.Enums.Response.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Model is released and cannot be modified",
              ""
            );
          default:
            return errorResponsePOST(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
              "Failed to create the occupation group in the DB",
              ""
            );
        }
      }
      return errorResponsePOST(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupPOSTAPISpecs.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_GROUP,
        "Failed to create the occupation group in the DB",
        ""
      );
    }
  }
}
