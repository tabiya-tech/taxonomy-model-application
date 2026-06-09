import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import mongoose from "mongoose";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import AuthAPISpecs from "api-specifications/auth";
import SkillAPISpecs from "api-specifications/esco/skill";
import { buildOccupationsResponse } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForSkillValidationErrorCode } from "esco/skill/_shared/skill.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "../../../_shared/params";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { SignallingValueLabel } from "esco/common/objectTypes";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";

export class SkillOccupationsPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/skills/{id}/occupations:
   *   post:
   *    operationId: POSTSkillOccupationsById
   *    tags:
   *      - skills
   *    summary: Link a skill occupation.
   *    description: Establish or update a requirement relation between an occupation and a skill in a specific taxonomy model.
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
   *          description: The unique ID of the required skill.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/SkillOccupationsRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the skill occupation.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/SkillOccupationsResponseSchemaGET/properties/data/items'
   *      '400':
   *        description: |
   *          Failed to link the occupation. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillOccupations400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Skill, occupation, or model not found.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETSkillOccupations404ErrorSchema'
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
      const params = extractAndValidateIdParams(event, Routes.SKILL_OCCUPATIONS_ROUTE);
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
          SkillAPISpecs.Skill.Occupations.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          SkillAPISpecs.Skill.Occupations.POST.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      if (validationResult === ModelForSkillValidationErrorCode.MODEL_IS_RELEASED) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          SkillAPISpecs.Skill.Occupations.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
          "Cannot modify a released model",
          ""
        );
      }

      // 4. Fetch the required skill
      const skill = await getRepositoryRegistry()
        .skill.Model.findOne({
          _id: params.id,
          modelId: params.modelId,
        })
        .exec();
      if (!skill) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Skill.Occupations.POST.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
          "Required skill not found",
          `No skill found with id: ${params.id} in model: ${params.modelId}`
        );
      }

      // 5. Fetch the requiring occupation
      const occupation = await getRepositoryRegistry()
        .occupation.Model.findOne({
          _id: payload.requiringOccupationId,
          modelId: params.modelId,
        })
        .exec();
      if (!occupation) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          SkillAPISpecs.Skill.Occupations.POST.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "Requiring occupation not found",
          `No occupation found with id: ${payload.requiringOccupationId} in model: ${params.modelId}`
        );
      }

      // 6. Validate type-specific relationship rules
      const isEsco = occupation.occupationType === ObjectTypes.ESCOOccupation;
      const relationType = payload.relationType;
      const signallingValueLabel = payload.signallingValueLabel;

      if (isEsco) {
        if (relationType === SkillAPISpecs.Enums.OccupationToSkillRelationType.NONE) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            SkillAPISpecs.Skill.Occupations.POST.Errors.Status400.ErrorCodes.INVALID_RELATION_TYPE,
            "ESCO occupations must have relationType set to essential or optional",
            ""
          );
        }
        if (signallingValueLabel !== SignallingValueLabel.NONE) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            SkillAPISpecs.Skill.Occupations.POST.Errors.Status400.ErrorCodes.INVALID_SIGNALLING_VALUE_LABEL,
            "ESCO occupations cannot have signalling value label",
            ""
          );
        }
      } else {
        const hasRelation = relationType !== SkillAPISpecs.Enums.OccupationToSkillRelationType.NONE;
        const hasSignalling = signallingValueLabel !== SignallingValueLabel.NONE;

        if (hasRelation && hasSignalling) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            SkillAPISpecs.Skill.Occupations.POST.Errors.Status400.ErrorCodes.MUTUALLY_EXCLUSIVE_VALUES,
            "Local occupations cannot have both relationType and signallingValueLabel set",
            ""
          );
        }
        if (!hasRelation && !hasSignalling) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            SkillAPISpecs.Skill.Occupations.POST.Errors.Status400.ErrorCodes.INVALID_RELATION_TYPE,
            "Local occupations must have either relationType or signallingValueLabel set",
            ""
          );
        }
      }

      // 7. Update/insert the relationship pair in DB
      const RelationModel = getRepositoryRegistry().occupationToSkillRelation.relationModel;
      await RelationModel.findOneAndUpdate(
        {
          modelId: new mongoose.Types.ObjectId(params.modelId),
          requiringOccupationId: new mongoose.Types.ObjectId(payload.requiringOccupationId),
          requiredSkillId: new mongoose.Types.ObjectId(params.id),
        },
        {
          requiringOccupationType: occupation.occupationType,
          requiringOccupationDocModel: MongooseModelName.Occupation,
          requiredSkillDocModel: MongooseModelName.Skill,
          relationType: payload.relationType as unknown as OccupationToSkillRelationType,
          signallingValueLabel: payload.signallingValueLabel as unknown as SignallingValueLabel,
          signallingValue: payload.signallingValue || null,
        },
        { upsert: true, new: true }
      ).exec();

      const occupationWithRelation: OccupationToSkillReferenceWithRelationType<IOccupationReference> = {
        ...occupation.toObject(),
        relationType: payload.relationType as unknown as OccupationToSkillRelationType,
        signallingValue: payload.signallingValue || null,
        signallingValueLabel: payload.signallingValueLabel as unknown as SignallingValueLabel,
      };

      return responseJSON(StatusCodes.CREATED, buildOccupationsResponse(occupationWithRelation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to link skill occupation:", error);
      errorLoggerInstance.logError(
        "Failed to link skill occupation in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        SkillAPISpecs.Skill.Occupations.POST.Errors.Status500.ErrorCodes.DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
        "Failed to link skill occupation in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new SkillOccupationsPostController().post(event);
};
