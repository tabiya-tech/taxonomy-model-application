import { APIGatewayProxyEvent } from "aws-lambda";
import { APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { errorResponseGET, StatusCodes } from "server/httpUtils";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { getAcceptLanguageHeader, resolveLanguageConfig } from "common/language/resolveLanguage";
import { ModelForOccupationValidationErrorCode, ValidateModelResult } from "../services/occupation.service.types";
import LanguageAPISpecs from "api-specifications/language";

export type LanguageResolutionResult =
  | { languageConfig: LanguageAPISpecs.Types.ILanguageConfig }
  | APIGatewayProxyResult;

/**
 * Validates the model result for hard errors, then resolves the Accept-Language header
 * against the model's available languages.
 *
 * Returns { languageConfig } on success. Released models (MODEL_IS_RELEASED) are not errors for GET
 * endpoints — they fall through to language resolution with an empty availableLanguages list, which
 * causes resolveLanguageConfig to return the fallback language.
 */
export function resolveLanguageFromModelResult(
  event: APIGatewayProxyEvent,
  validationResult: ValidateModelResult,
  modelId: string
): LanguageResolutionResult {
  if (validationResult.errorCode === ModelForOccupationValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
    return errorResponseGET(
      StatusCodes.NOT_FOUND,
      OccupationAPISpecs.GET.Errors.Status404.ErrorCodes.MODEL_NOT_FOUND,
      "Model not found",
      `No model found with id: ${modelId}`
    );
  }
  if (validationResult.errorCode === ModelForOccupationValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
    return errorResponseGET(
      StatusCodes.INTERNAL_SERVER_ERROR,
      OccupationAPISpecs.GET.Errors.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_OCCUPATIONS,
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
