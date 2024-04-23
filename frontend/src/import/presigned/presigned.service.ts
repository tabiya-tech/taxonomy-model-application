import Ajv, { ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import PresignedAPISpecs from "api-specifications/presigned";

import { ErrorCodes } from "src/error/errorCodes";
import { getServiceErrorFactory } from "src/error/error";

import { StatusCodes } from "http-status-codes/";
import { fetchWithAuth } from "src/apiService/APIService";

const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
addFormats(ajv); // To support the "date-time" format
ajv.addSchema(PresignedAPISpecs.Schemas.GET.Response.Payload, PresignedAPISpecs.Schemas.GET.Response.Payload.$id);
const responseValidator: ValidateFunction = ajv.getSchema(
  PresignedAPISpecs.Schemas.GET.Response.Payload.$id as string
) as ValidateFunction;

export default class PresignedService {
  readonly apiServerUrl: string;
  readonly presignedEndpointUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
    this.presignedEndpointUrl = `${this.apiServerUrl}/presigned`;
  }

  /**
   * Resolves with a IPresignedResponse or rejects with a ServiceError
   *
   */
  async getPresignedPost(): Promise<PresignedAPISpecs.Types.GET.Response.Payload> {
    const errorFactory = getServiceErrorFactory(
      "PresignedService",
      "getPresignedPost",
      "GET",
      this.presignedEndpointUrl
    );
    let response;
    let responseBody: string;
    response = await fetchWithAuth(this.presignedEndpointUrl, {
      method: "GET",
      expectedStatusCode: StatusCodes.OK,
      serviceName: "PresignedService",
      serviceFunction: "getPresignedPost",
      failureMessage: "Failed to get the pre-signed data",
      expectedContentType: "application/json",
    });
    responseBody = await response.text();

    let presignedResponse: PresignedAPISpecs.Types.GET.Response.Payload;
    try {
      presignedResponse = JSON.parse(responseBody);
    } catch (e: any) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not contain valid JSON", {
        responseBody,
        error: e,
      });
    }
    const result = responseValidator(presignedResponse);
    if (!result) {
      throw errorFactory(
        response.status,
        ErrorCodes.INVALID_RESPONSE_BODY,
        "Response did not conform to the expected schema",
        {
          responseBody: presignedResponse,
          errors: responseValidator.errors,
        }
      );
    }

    return presignedResponse;
  }
}
