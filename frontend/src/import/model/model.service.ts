import Ajv, {ValidateFunction} from 'ajv/dist/2020';
import addFormats from "ajv-formats";
import {
  IModelInfoRequest,
  IModelInfoResponse,
  LocaleSchema, ModelInfoRequestSchema,
  ModelInfoResponseSchema
} from "api-specifications/modelInfo";

import {ErrorCodes} from "src/error/errorCodes";
import {getServiceErrorFactory} from "src/error/error";
import {StatusCodes} from "http-status-codes/";

const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
addFormats(ajv);// To support the "date-time" format
ajv.addSchema(LocaleSchema, LocaleSchema.$id);
ajv.addSchema(ModelInfoRequestSchema, ModelInfoRequestSchema.$id);
ajv.addSchema(ModelInfoResponseSchema, ModelInfoResponseSchema.$id);
const responseValidator: ValidateFunction = ajv.getSchema(ModelInfoResponseSchema.$id as string) as ValidateFunction;

export type INewModelSpecification = IModelInfoRequest

export default class ModelService {
  readonly apiServerUrl: string;
  readonly createModelEndpointUrl: string;

  constructor(apiServerUrl: string) {
    this.apiServerUrl = apiServerUrl;
    this.createModelEndpointUrl = `${this.apiServerUrl}/models`;
  }

  /**
   * Resolves with the modelID or rejects with a ServiceError
   *
   */
  public async createModel(newModelSpec: INewModelSpecification): Promise<string> {
    const errorFactory = getServiceErrorFactory("ModelService", "createModel", "POST", this.createModelEndpointUrl);
    let response;
    let responseBody: string;
    const requestBody = JSON.stringify(newModelSpec);
    try {
      response = await fetch(this.createModelEndpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });
      responseBody = await response.text();

    } catch (e: any) {
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Failed to create model", e);
    }

    if (response.status !== StatusCodes.CREATED) {
      // Server responded with a status code that indicates that the resource was not created
      // The responseBody should be an ErrorResponse but that is not guaranteed e.g. if a gateway in the middle returns a 502,
      // or if the server is not conforming to the error response schema
      throw errorFactory(response.status, ErrorCodes.API_ERROR, "Failed to create model", responseBody);
    }
    // Resource was created
    // Expect that the responseBody is a ModelResponse
    const contentType = response.headers.get("Content-Type");
    if(!contentType || !contentType.includes("application/json")) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_HEADER, "Response Content-Type should be 'application/json'", `Content-Type header was ${contentType}`);
    }

    let modelResponse: IModelInfoResponse;
    try {
      modelResponse = JSON.parse(responseBody);
    } catch (e: any) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not contain valid JSON", {responseBody, error: e});
    }
    const result = responseValidator(modelResponse);
    if (!result) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not conform to the expected schema", {responseBody: modelResponse, errors: responseValidator.errors});
    }

    return modelResponse.id;
  }
}