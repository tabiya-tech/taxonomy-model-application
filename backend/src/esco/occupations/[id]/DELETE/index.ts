import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponse, response, StatusCodes } from "server/httpUtils";
import { getServiceRegistry } from "server/serviceRegistry/serviceRegistry";
import AuthAPISpecs from "api-specifications/auth";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { Routes } from "routes.constant";
import { RoleRequired } from "auth/authorizer";
import {
  ModelForOccupationValidationErrorCode,
  OccupationHasChildrenError,
  OccupationModelValidationError,
  OccupationServiceError,
  OccupationServiceErrorCode,
} from "../../services/occupation.service.types";
import { extractAndValidateIdParams } from "../../_shared/params";

export class OccupationDELETEController {
  /**
   * @openapi
   *
   * /models/{modelId}/occupations/{id}:
   *   delete:
   *     operationId: DELETEOccupationById
   *     tags:
   *       - occupations
   *     summary: Delete an occupation by its ID.
   *     description: Delete a leaf occupation entity and its relationships in a specific taxonomy model.
   *     security:
   *       - api_key: []
   *       - jwt_auth: []
   *     parameters:
   *       - in: path
   *         name: modelId
   *         required: true
   *         schema:
   *           type: string
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       '204':
   *         description: Successfully deleted the occupation.
   *       '400':
   *         description: Cannot alter released model or invalid params.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DELETEOccupation400ErrorSchema'
   *       '401':
   *         $ref: '#/components/responses/UnAuthorizedResponse'
   *       '403':
   *         description: |
   *           The request has not been applied because you don't have the right permissions to access this resource.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AllForbidden403ResponseSchema'
   *       '404':
   *         description: Occupation or model not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DELETEOccupation404ErrorSchema'
   *       '409':
   *         description: Cannot delete occupation with child occupations.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DELETEOccupation409ErrorSchema'
   *       '500':
   *         description: |
   *           The server encountered an unexpected condition.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/All500ResponseSchema'
   */
  @RoleRequired(AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER)
  async delete(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const params = extractAndValidateIdParams(event, Routes.OCCUPATION_ROUTE);
    if ("statusCode" in params) {
      return params;
    }

    try {
      const service = getServiceRegistry().occupation;
      await service.delete(params.id, params.modelId);
      return response(StatusCodes.NO_CONTENT, null);
    } catch (error: unknown) {
      console.error("Failed to delete occupation:", error);

      if (error instanceof OccupationHasChildrenError) {
        return errorResponse(
          StatusCodes.CONFLICT,
          OccupationAPISpecs.Occupation.DELETE.Errors.Status409.ErrorCodes.CANNOT_DELETE_ENTITY_WITH_CHILDREN,
          "Cannot delete non-leaf occupation",
          `Occupation with id ${params.id} has child occupations and cannot be deleted`
        );
      }

      if (error instanceof OccupationModelValidationError) {
        switch (error.code) {
          case ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID:
            return errorResponse(
              StatusCodes.NOT_FOUND,
              OccupationAPISpecs.Occupation.DELETE.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
              "Model not found by the provided ID",
              ""
            );
          case ModelForOccupationValidationErrorCode.MODEL_IS_RELEASED:
            return errorResponse(
              StatusCodes.BAD_REQUEST,
              OccupationAPISpecs.Occupation.DELETE.Errors.Status400.ErrorCodes.UNABLE_TO_ALTER_RELEASED_MODEL,
              "Cannot delete occupations in a released model",
              ""
            );
          default:
            return errorResponse(
              StatusCodes.INTERNAL_SERVER_ERROR,
              OccupationAPISpecs.Occupation.DELETE.Errors.Status500.ErrorCodes.DB_FAILED_TO_DELETE_OCCUPATION,
              "Failed to fetch the model details from the DB",
              ""
            );
        }
      }

      if (error instanceof OccupationServiceError) {
        if (error.code === OccupationServiceErrorCode.OCCUPATION_NOT_FOUND) {
          return errorResponse(
            StatusCodes.NOT_FOUND,
            OccupationAPISpecs.Occupation.DELETE.Errors.Status404.ErrorCodes.OCCUPATION_NOT_FOUND,
            "Occupation not found",
            `No occupation found with id: ${params.id}`
          );
        }
      }

      return errorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        OccupationAPISpecs.Occupation.DELETE.Errors.Status500.ErrorCodes.DB_FAILED_TO_DELETE_OCCUPATION,
        "Failed to delete the occupation from the DB",
        ""
      );
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return new OccupationDELETEController().delete(event);
};
