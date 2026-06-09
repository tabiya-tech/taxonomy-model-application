import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import mongoose from "mongoose";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { buildParentResponse } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "../../../_shared/params";
import { ObjectTypes } from "esco/common/objectTypes";
import { getModelName, MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillDoc } from "esco/skill/_shared/skill.types";
import { ISkillGroupDoc } from "esco/skillGroup/_shared/skillGroup.types";
import { ISkill } from "esco/skill/_shared/skill.types";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";

export class SkillParentsPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}/parents:
   *   post:
   *    operationId: POSTSkillParentsById
   *    tags:
   *      - skills
   *    summary: Link a skill parent.
   *    description: Establish or update a parent relationship for a specific skill in a specific taxonomy model.
   *    security:
   *      - api_key: []
   *      - jwt_auth: []
   *    parameters:
   *      - in: path
   *        name: modelId
   *        required: true
   *        schema:
   *          $ref: '#/components/schemas/SkillRequestParamSchemaGET/properties/modelId'
   *      - in: path
   *        name: id
   *        required: true
   *        schema:
   *          type: string
   *          description: The unique ID of the child skill.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/SkillParentsRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the skill parent.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/SkillParentsResponseSchemaGET/properties/data/items'
   *      '400':
   *        description: |
   *          Failed to link the parent. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillParents400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Skill, parent, or model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillParents404ErrorSchema'
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
      const params = extractAndValidateIdParams(event, Routes.SKILL_PARENTS_ROUTE);
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
      const service = getServiceRegistry().skill;
      const validationResult = await service.validateModelForSkill(params.modelId);
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Skill.Parents.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.Skill.Parents.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_PARENT_RELATION,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_IS_RELEASED) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          SkillAPISpecs.Skill.Parents.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
          "Cannot modify a released model",
          ""
        );
      }

      // 4. Fetch the child skill
      const child = await getRepositoryRegistry()
        .skill.Model.findOne({
          _id: params.id,
          modelId: params.modelId,
        })
        .exec();
      if (!child) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Skill.Parents.POST.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
          "Child skill not found",
          `No skill found with id: ${params.id} in model: ${params.modelId}`
        );
      }

      // 5. Fetch the parent entity (either SkillGroup or Skill)
      let parentDoc: mongoose.HydratedDocument<ISkillDoc> | mongoose.HydratedDocument<ISkillGroupDoc> | null = null;
      const parentType = payload.parentType;
      if (parentType === ObjectTypes.SkillGroup) {
        parentDoc = await getRepositoryRegistry()
          .skillGroup.Model.findOne({
            _id: payload.parentId,
            modelId: params.modelId,
          })
          .exec();
      } else if (parentType === ObjectTypes.Skill) {
        parentDoc = await getRepositoryRegistry()
          .skill.Model.findOne({
            _id: payload.parentId,
            modelId: params.modelId,
          })
          .exec();
      }

      if (!parentDoc) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Skill.Parents.POST.Errors.Status404.ErrorCodes.PARENT_NOT_FOUND,
          "Parent not found",
          `No parent of type ${parentType} found with id: ${payload.parentId} in model: ${params.modelId}`
        );
      }

      // 6. Update/insert the hierarchy pair
      const parentDocModel = getModelName(payload.parentType as unknown as ObjectTypes);
      const childDocModel = MongooseModelName.Skill;

      const HierarchyModel = getRepositoryRegistry().skillHierarchy.hierarchyModel;
      await HierarchyModel.findOneAndUpdate(
        {
          modelId: new mongoose.Types.ObjectId(params.modelId),
          parentId: new mongoose.Types.ObjectId(payload.parentId),
          parentType: payload.parentType as unknown as ObjectTypes,
          childId: new mongoose.Types.ObjectId(params.id),
          childType: ObjectTypes.Skill,
        },
        {
          parentDocModel: parentDocModel,
          childDocModel: childDocModel,
        },
        { upsert: true, new: true }
      ).exec();

      const transformedParent = parentDoc.toObject() as ISkill | ISkillGroup;

      return responseJSON(StatusCodes.CREATED, buildParentResponse(transformedParent, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to link skill parent:", error);
      errorLoggerInstance.logError(
        "Failed to link skill parent in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Skill.Parents.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_PARENT_RELATION,
        "Failed to link skill parent in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillParentsPostController().post(event);
};
