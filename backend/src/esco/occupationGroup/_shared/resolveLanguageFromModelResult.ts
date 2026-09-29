import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, StatusCodes } from "server/httpUtils";
import { getAcceptLanguageHeader, resolveLanguageConfig } from "common/language/resolveLanguage";
import {
  ModelForOccupationGroupValidationErrorCode,
  ValidateModelForOccupationGroupResult,
} from "../_shared/OccupationGroup.types";
import LanguageAPISpecs from "api-specifications/language";
import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import ErrorAPISpecs from "api-specifications/error";

export type LanguageResolutionResult =
  | { languageConfig: LanguageAPISpecs.Types.ILanguageConfig }
  | APIGatewayProxyResult;

/**
 * Validates the model result for hard errors, then resolves the Accept-Language header against the model's
 * available languages. MODEL_IS_RELEASED is not an error here; it falls through with an empty
 * availableLanguages list, resolving to the fallback language.
 *
 * @param dbFailedErrorCode caller-supplied since each endpoint has its own DB_FAILED_TO_RETRIEVE_* code.
 */
export function resolveLanguageFromModelResult(
  event: APIGatewayProxyEvent,
  validationResult: ValidateModelForOccupationGroupResult,
  modelId: string,
  dbFailedErrorCode: ErrorAPISpecs.Types.GET["errorCode"]
): LanguageResolutionResult {
  if (validationResult.errorCode === ModelForOccupationGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
    return errorResponseGET(
      StatusCodes.NOT_FOUND,
      OccupationGroupAPISpecs.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
      "Model not found",
      `No model found with id: ${modelId}`
    );
  }
  if (validationResult.errorCode === ModelForOccupationGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
    return errorResponseGET(
      StatusCodes.INTERNAL_SERVER_ERROR,
      dbFailedErrorCode,
      "Failed to fetch the model details from the DB",
      ""
    );
  }
  // MODEL_IS_RELEASED is not an error for read endpoints. availableLanguages is absent on that
  // variant, so ?? [] causes resolveLanguageConfig to return the fallback language.
  const languageConfig = resolveLanguageConfig(
    getAcceptLanguageHeader(event.headers),
    validationResult.availableLanguages ?? []
  );
  return { languageConfig };
}
