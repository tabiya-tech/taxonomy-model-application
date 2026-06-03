import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import mongoose from "mongoose";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildParentResponse } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForOccupationValidationErrorCode } from "../../../services/occupation.service.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "../../../_shared/params";
import { ObjectTypes } from "esco/common/objectTypes";
import { getModelName, MongooseModelName } from "esco/common/mongooseModelNames";
import {
  isNewOccupationHierarchyPairSpecValid,
  isParentChildCodeConsistent,
} from "esco/occupationHierarchy/occupationHierarchyValidation";
import { IOccupation, IOccupationDoc } from "../../../_shared/occupation.types";
import { IOccupationGroup, IOccupationGroupDoc } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { OccupationHierarchyParentType } from "esco/occupationHierarchy/occupationHierarchy.types";

export class OccupationParentPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}/parent:
   *   post:
   *    operationId: POSTOccupationParentById
   *    tags:
   *      - occupations
   *    summary: Link an occupation parent.
   *    description: Establish or update the parent relationship for a specific occupation in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/OccupationRequestParamSchemaGET/properties/modelId'
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *          description: The unique ID of the child occupation.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/OccupationParentRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the occupation parent.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/OccupationResponseSchemaGETParent'
   *      '400':
   *        description: |
   *          Failed to link the parent. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Occupation or parent not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation404ErrorSchema'
   *      '500':
   *        description: |
   *          The server encountered an unexpected condition.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/All500ResponseSchema'
   *
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async post(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
      // 1. Parse and validate path parameters
      const params = extractAndValidateIdParams(event, Routes.OCCUPATION_PARENT_ROUTE);
      if ("statusCode" in params) {
        return params;
      }

      // 2. Parse and validate request body
      const parsedRequestResult = parseAndValidatePOSTRequest(event);
      if ("statusCode" in parsedRequestResult) {
        return parsedRequestResult;
      }
      const payload = parsedRequestResult;

      // 3. Validate model state (exists & is not released)
      const service = getServiceRegistry().occupation;
      const validationResult = await service.validateModelForOccupation(params.modelId);
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_PARENT,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
          "Cannot modify a released model",
          ""
        );
      }

      // 4. Fetch the child occupation
      const child = await getRepositoryRegistry()
        .occupation.Model.findOne({
          _id: params.id,
          modelId: params.modelId,
        })
        .exec();
      if (!child) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "Child occupation not found",
          `No occupation found with id: ${params.id} in model: ${params.modelId}`
        );
      }

      // 5. Fetch the parent entity (either OccupationGroup or Occupation)
      let parentDoc: mongoose.HydratedDocument<IOccupationDoc> | mongoose.HydratedDocument<IOccupationGroupDoc> | null =
        null;
      const parentType = payload.parentType;
      if (parentType === ObjectTypes.ISCOGroup || parentType === ObjectTypes.LocalGroup) {
        parentDoc = await getRepositoryRegistry()
          .OccupationGroup.Model.findOne({
            _id: payload.parentId,
            modelId: params.modelId,
          })
          .exec();
      } else if (parentType === ObjectTypes.ESCOOccupation || parentType === ObjectTypes.LocalOccupation) {
        parentDoc = await getRepositoryRegistry()
          .occupation.Model.findOne({
            _id: payload.parentId,
            modelId: params.modelId,
          })
          .exec();
      }

      if (!parentDoc) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status404.ErrorCodes.PARENT_NOT_FOUND,
          "Parent not found",
          `No parent of type ${parentType} found with id: ${payload.parentId} in model: ${params.modelId}`
        );
      }

      const parentObjectType =
        "occupationType" in parentDoc
          ? (parentDoc as mongoose.HydratedDocument<IOccupationDoc>).occupationType
          : (parentDoc as mongoose.HydratedDocument<IOccupationGroupDoc>).groupType;

      // 6. Validate parent-child type compatibility & code consistency
      const existingIds = new Map<string, ObjectTypes[]>();
      existingIds.set(child._id.toString(), [child.occupationType]);
      existingIds.set(parentDoc._id.toString(), [parentObjectType]);

      const idToCode = new Map<string, { type: ObjectTypes; code: string }[]>();
      idToCode.set(child._id.toString(), [{ type: child.occupationType, code: child.code }]);
      idToCode.set(parentDoc._id.toString(), [{ type: parentObjectType, code: parentDoc.code }]);

      const isPairValid = isNewOccupationHierarchyPairSpecValid(
        {
          parentId: payload.parentId,
          parentType: payload.parentType as unknown as OccupationHierarchyParentType,
          childId: params.id,
          childType: child.occupationType,
        },
        existingIds
      );
      if (!isPairValid) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status400.ErrorCodes.INVALID_PARENT_TYPE,
          "Invalid parent-child type relationship",
          ""
        );
      }

      const isCodeValid = isParentChildCodeConsistent(
        payload.parentType as unknown as ObjectTypes,
        payload.parentId,
        child.occupationType,
        params.id,
        idToCode
      );
      if (!isCodeValid) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationAPISpecs.Occupation.Parent.POST.Errors.Status400.ErrorCodes.PARENT_CHILD_CODE_INCONSISTENT,
          "Parent and child codes are inconsistent",
          ""
        );
      }

      // 7. Update/insert the hierarchy pair
      const parentDocModel = getModelName(payload.parentType as unknown as ObjectTypes);
      const childDocModel = MongooseModelName.Occupation;

      const HierarchyModel = getRepositoryRegistry().occupationHierarchy.hierarchyModel;
      await HierarchyModel.findOneAndUpdate(
        {
          modelId: new mongoose.Types.ObjectId(params.modelId),
          childId: new mongoose.Types.ObjectId(params.id),
          childType: child.occupationType,
        },
        {
          parentId: new mongoose.Types.ObjectId(payload.parentId),
          parentType: payload.parentType as unknown as OccupationHierarchyParentType,
          parentDocModel: parentDocModel,
          childDocModel: childDocModel,
        },
        { upsert: true, new: true }
      ).exec();

      const transformedParent = parentDoc.toObject() as IOccupation | IOccupationGroup;

      return responseJSON(StatusCodes.CREATED, buildParentResponse(transformedParent, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to link occupation parent:", error);
      errorLoggerInstance.logError(
        "Failed to link occupation parent in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Occupation.Parent.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_PARENT,
        "Failed to link occupation parent in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationParentPostController().post(event);
};
