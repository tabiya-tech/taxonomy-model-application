import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import mongoose from "mongoose";
import { errorResponse, responseJSON, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { buildSkillsResponse } from "./response";
import { parseAndValidatePOSTRequest } from "./request";
import { getResourcesBaseUrl } from "server/config/config";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import { ModelForOccupationValidationErrorCode, ISkillWithRelation } from "../../../services/occupation.service.types";
import errorLoggerInstance from "common/errorLogger/errorLogger";
import { extractAndValidateIdParams } from "../../../_shared/params";
import { ObjectTypes } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { SignallingValueLabel } from "esco/common/objectTypes";

export class OccupationSkillsPostController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}/skills:
   *   post:
   *    operationId: POSTOccupationSkillsById
   *    tags:
   *      - occupations
   *    summary: Link an occupation skill.
   *    description: Establish or update a requirement relation between an occupation and a skill in a specific taxonomy model.
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
   *          description: The unique ID of the requiring occupation.
   *    requestBody:
   *       content:
   *         application/json:
   *           schema:
   *              $ref: '#/components/schemas/OccupationSkillsRequestSchemaPOST'
   *       required: true
   *    responses:
   *      '201':
   *        description: Successfully linked the occupation skill.
   *        content:
   *          application/json:
   *            schema:
   *               $ref: '#/components/schemas/OccupationResponseSchemaGETSkills/properties/data/items'
   *      '400':
   *        description: |
   *          Failed to link the occupation skill. Additional information can be found in the response body.
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/GETOccupation400ErrorSchema'
   *      '401':
   *        $ref: '#/components/responses/UnAuthorizedResponse'
   *      '403':
   *        $ref: '#/components/responses/ForbiddenResponse'
   *      '404':
   *        description: Occupation, skill, or model not found.
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
      const params = extractAndValidateIdParams(event, Routes.OCCUPATION_SKILLS_ROUTE);
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
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
          "Model not found",
          `No model found with id: ${params.modelId}`
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
        return errorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status500.ErrorCodes
            .DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
          "Failed to fetch the model details from the DB",
          ""
        );
      }
      if (validationResult === ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED) {
        return errorResponse(
          StatusCodes.BAD_REQUEST,
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.MODEL_IS_RELEASED,
          "Cannot modify a released model",
          ""
        );
      }

      // 4. Fetch the child occupation (requiring entity)
      const child = await getRepositoryRegistry()
        .occupation.Model.findOne({
          _id: params.id,
          modelId: params.modelId,
        })
        .exec();
      if (!child) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
          "Occupation not found",
          `No occupation found with id: ${params.id} in model: ${params.modelId}`
        );
      }

      // 5. Fetch the required skill
      const skill = await getRepositoryRegistry()
        .skill.Model.findOne({
          _id: payload.requiredSkillId,
          modelId: params.modelId,
        })
        .exec();
      if (!skill) {
        return errorResponse(
          StatusCodes.NOT_FOUND,
          OccupationAPISpecs.Occupation.Skills.POST.Errors.Status404.ErrorCodes.SKILL_NOT_FOUND,
          "Required skill not found",
          `No skill found with id: ${payload.requiredSkillId} in model: ${params.modelId}`
        );
      }

      // 6. Validate type-specific relationship rules
      const isEsco = child.occupationType === ObjectTypes.ESCOOccupation;
      const relationType = payload.relationType;
      const signallingValueLabel = payload.signallingValueLabel;

      if (isEsco) {
        // ESCO occupations must have relationType and no signalling properties
        if (relationType === OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.INVALID_RELATION_TYPE,
            "ESCO occupations must have relationType set to essential or optional",
            ""
          );
        }
        if (signallingValueLabel !== SignallingValueLabel.NONE) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.INVALID_SIGNALLING_VALUE_LABEL,
            "ESCO occupations cannot have signalling value label",
            ""
          );
        }
      } else {
        // Local occupations: relationType and signallingValueLabel are mutually exclusive
        const hasRelation = relationType !== OccupationAPISpecs.Enums.OccupationToSkillRelationType.NONE;
        const hasSignalling = signallingValueLabel !== SignallingValueLabel.NONE;

        if (hasRelation && hasSignalling) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.MUTUALLY_EXCLUSIVE_VALUES,
            "Local occupations cannot have both relationType and signallingValueLabel set",
            ""
          );
        }
        if (!hasRelation && !hasSignalling) {
          return errorResponse(
            StatusCodes.BAD_REQUEST,
            OccupationAPISpecs.Occupation.Skills.POST.Errors.Status400.ErrorCodes.INVALID_RELATION_TYPE,
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
          requiringOccupationId: new mongoose.Types.ObjectId(params.id),
          requiredSkillId: new mongoose.Types.ObjectId(payload.requiredSkillId),
        },
        {
          requiringOccupationType: child.occupationType,
          requiringOccupationDocModel: MongooseModelName.Occupation,
          requiredSkillDocModel: MongooseModelName.Skill,
          relationType: payload.relationType as unknown as OccupationToSkillRelationType,
          signallingValueLabel: payload.signallingValueLabel as unknown as SignallingValueLabel,
          signallingValue: payload.signallingValue || null,
        },
        { upsert: true, new: true }
      ).exec();

      const skillWithRelation: ISkillWithRelation = {
        ...skill.toObject(),
        relationType: payload.relationType as unknown as OccupationToSkillRelationType,
        signallingValue: payload.signallingValue || null,
        signallingValueLabel: payload.signallingValueLabel as unknown as SignallingValueLabel,
      };

      return responseJSON(StatusCodes.CREATED, buildSkillsResponse(skillWithRelation, getResourcesBaseUrl()));
    } catch (error: unknown) {
      console.error("Failed to link occupation skill:", error);
      errorLoggerInstance.logError(
        "Failed to link occupation skill in the DB",
        error instanceof Error ? error.name : "Unknown error"
      );
      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Occupation.Skills.POST.Errors.Status500.ErrorCodes
          .DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION,
        "Failed to link occupation skill in the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationSkillsPostController().post(event);
};
