import Ajv, {ValidateFunction} from 'ajv/dist/2020';
import addFormats from "ajv-formats";
import Presigned from "api-specifications/presigned";

import {ErrorCodes} from "src/error/errorCodes";
import {getServiceErrorFactory} from "src/error/error";

import {StatusCodes} from "http-status-codes/";

const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
addFormats(ajv);// To support the "date-time" format
ajv.addSchema(Presigned.GET.Response.Schema, Presigned.GET.Response.Schema.$id);
const responseValidator: ValidateFunction = ajv.getSchema(Presigned.GET.Response.Schema.$id as string) as ValidateFunction;

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
  async getPresignedPost(): Promise<Presigned.GET.Response.Payload> {
    const errorFactory = getServiceErrorFactory("PresignedService", "getPresignedPost", "GET", this.presignedEndpointUrl);
    let response;
    let responseBody: string;
    try {
      response = await fetch(this.presignedEndpointUrl, {
        method: "GET",
      });
      responseBody = await response.text();
    } catch (e: any) {
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Failed to get the pre-signed data", e);
    }

    if (response.status !== StatusCodes.OK) {
      // Server responded with a status code that indicates that the resource was not OK
      // The responseBody should be an ErrorResponse but that is not guaranteed e.g. if a gateway in the middle returns a 502,
      // or if the server is not conforming to the error response schema
      throw errorFactory(response.status, ErrorCodes.API_ERROR, "Failed to get the presigned data", responseBody);
    }
    // Presigned was issued
    // Expect that the responseBody is a PresignedResponse
    const contentType = response.headers.get("Content-Type");
    if (!contentType?.includes("application/json")) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_HEADER, "Response Content-Type should be 'application/json'", `Content-Type header was ${contentType}`);
    }

    let presignedResponse: Presigned.GET.Response.Payload;
    try {
      presignedResponse = JSON.parse(responseBody);
    } catch (e: any) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not contain valid JSON", {
        responseBody,
        error: e
      });
    }
    const result = responseValidator(presignedResponse);
    if (!result) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not conform to the expected schema", {
        responseBody: presignedResponse,
        errors: responseValidator.errors
      });
    }

    return presignedResponse;
  }
}