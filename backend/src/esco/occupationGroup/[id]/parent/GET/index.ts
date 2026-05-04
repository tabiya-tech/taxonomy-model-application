import { ValidateFunction } from "ajv";
import { APIGatewayProxyEvent } from "aws-lambda";
import AuthAPISpecs from "api-specifications/auth";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import OccupationGroupDetailAPISpecs from "api-specifications/esco/occupationGroup/[id]";
import ErrorAPISpecs from "api-specifications/error";
import { RoleRequired } from "auth/authorizer";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { ajvInstance } from "validator";
import { getResourcesBaseUrl } from "server/config/config";
import { errorResponse, errorResponseGET, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { ModelForOccupationGroupValidationErrorCode } from "../../../_shared/OccupationGroup.types";
import { IOccupationGroupService } from "../../../services/occupationGroup.service.type";
import { getOccupationGroupParentPathParameters } from "./query";
import { transformParent } from "./response";

export class OccupationGroupParentController {
  private readonly occupationGroupService: IOccupationGroupService;

  constructor() {
    this.occupationGroupService = getServiceRegistry().occupationGroup;
  }

  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS)
  async getParentOccupationGroup(event: APIGatewayProxyEvent) {
    try {
      const requestPathParameter = getOccupationGroupParentPathParameters(event.path);

      const validatePathFunction = ajvInstance.getSchema(
        OccupationGroupDetailAPISpecs.Schemas.Request.Param.Payload.$id as string
      ) as ValidateFunction<OccupationGroupAPISpecs.OccupationGroup.Types.Param.Payload>;

      const isValidPathParameter = validatePathFunction(requestPathParameter);
      if (!isValidPathParameter) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA,
          ErrorAPISpecs.Constants.ReasonPhrases.INVALID_JSON_SCHEMA,
          JSON.stringify({
            reason: "Invalid modelId or occupationGroup Id",
            path: event.path,
            pathParameters: event.pathParameters,
          })
        );
      }
      const validationResult = await this.occupationGroupService.validateModelForOccupationGroup(
        requestPathParameter.modelId
      );
      if (validationResult === ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${requestPathParameter.modelId}`
        );
      }
      if (validationResult === ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponseGET(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Enums.Response.Status500.ErrorCodes
            .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_PARENT,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      const parentOccupationGroup = await this.occupationGroupService.findParent(requestPathParameter.id);
      if (!parentOccupationGroup) {
        return errorResponseGET(
          StatusCodes.NOT_FOUND,
          OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Enums.Response.Status404.ErrorCodes
            .OCCUPATION_GROUP_PARENT_NOT_FOUND,
          "Occupation group or parent not found",
          `No occupation group or parent found with occupation group id: ${requestPathParameter.id}`
        );
      }
      return responseJSON(StatusCodes.OK, transformParent(parentOccupationGroup, getResourcesBaseUrl()));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Failed to get parent occupation group:", error);
      errorLoggerInstance.logError("Failed to retrieve the parent occupation group from the DB", error.name);
      return errorResponseGET(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Enums.Response.Status500.ErrorCodes
          .DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_PARENT,
        "Failed to retrieve the parent occupation group from the DB",
        ""
      );
    }
  }
}
