import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import mongoose from "mongoose";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { buildRelatedResponse } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "../../../_shared/params";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  SkillToSkillRelationType,
  SkillToSkillReferenceWithRelationType,
} from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { ISkill } from "esco/skill/_shared/skill.types";

export class SkillRelatedPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}/related:
   *   post:
   *    operationId: POSTSkillRelatedById
   *    tags:
   *      - skills
   *    summary: Link a related skill.
   *    description: Establish or update a relation between two skills in a specific taxonomy model.
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
   *          description: The unique ID of the requiring skill.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/SkillRelatedRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the related skill.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/SkillRelatedResponseSchemaGET/properties/data/items'
   *      '400':
   *        description: |
   *          Failed to link the skill. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillRelated400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Skill or model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillRelated404ErrorSchema'
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
      const params = extractAndValidateIdParams(event, Routes.SKILL_RELATED_ROUTE);
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
          SkillAPISpecs.Skill.RelatedSkills.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.Skill.RelatedSkills.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_RELATION,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_IS_RELEASED) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          SkillAPISpecs.Skill.RelatedSkills.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
          "Cannot modify a released model",
          ""
        );
      }

      // 4. Fetch the requiring skill
      const requiringSkill = await getRepositoryRegistry()
        .skill.Model.findOne({
          _id: params.id,
          modelId: params.modelId,
        })
        .exec();
      if (!requiringSkill) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Skill.RelatedSkills.POST.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
          "Requiring skill not found",
          `No skill found with id: ${params.id} in model: ${params.modelId}`
        );
      }

      // 5. Fetch the required skill
      const requiredSkill = await getRepositoryRegistry()
        .skill.Model.findOne({
          _id: payload.requiredSkillId,
          modelId: params.modelId,
        })
        .exec();
      if (!requiredSkill) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Skill.RelatedSkills.POST.Errors.Status404.ErrorCodes.REQUIRED_SKILL_NOT_FOUND,
          "Required skill not found",
          `No skill found with id: ${payload.requiredSkillId} in model: ${params.modelId}`
        );
      }

      // 6. Update/insert the relationship pair in DB
      const RelationModel = getRepositoryRegistry().skillToSkillRelation.relationModel;
      await RelationModel.findOneAndUpdate(
        {
          modelId: new mongoose.Types.ObjectId(params.modelId),
          requiringSkillId: new mongoose.Types.ObjectId(params.id),
          requiredSkillId: new mongoose.Types.ObjectId(payload.requiredSkillId),
        },
        {
          requiringSkillDocModel: MongooseModelName.Skill,
          requiredSkillDocModel: MongooseModelName.Skill,
          relationType: payload.relationType as unknown as SkillToSkillRelationType,
        },
        { upsert: true, new: true }
      ).exec();

      const skillWithRelation: SkillToSkillReferenceWithRelationType<ISkill> = {
        ...requiredSkill.toObject(),
        relationType: payload.relationType as unknown as SkillToSkillRelationType,
      };

      return responseJSON(StatusCodes.CREATED, buildRelatedResponse(skillWithRelation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to link related skill:", error);
      errorLoggerInstance.logError(
        "Failed to link related skill in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Skill.RelatedSkills.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_SKILL_RELATION,
        "Failed to link related skill in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillRelatedPostController().post(event);
};
