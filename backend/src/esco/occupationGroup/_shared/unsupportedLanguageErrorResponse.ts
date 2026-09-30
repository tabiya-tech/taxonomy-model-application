import { APIGatewayProxyResult } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import { errorResponse, StatusCodes } from "server/httpUtils";
import { OccupationGroupLanguageValidationError } from "../services/occupationGroup.service.type";

export function unsupportedLanguageErrorResponse(
  errorCode: ErrorAPISpecs.Types.Payload["errorCode"],
  error: OccupationGroupLanguageValidationError
): APIGatewayProxyResult {
  return errorResponse(
    StatusCodes.BAD_REQUEST,
    errorCode,
    `Field '${error.field}' uses a language not available in this model`,
    `Unsupported language: '${error.language}'`
  );
}
