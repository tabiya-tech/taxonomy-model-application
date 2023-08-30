import {ModelDirectoryTypes} from "src/modeldirectory/modelDirectory.types";
import {getServiceErrorFactory} from "src/error/error";
import {ErrorCodes} from "src/error/errorCodes";
import {StatusCodes} from "http-status-codes/";
import {
  LocaleSchema,
  ModelInfo,
  ModelInfoRequestSchemaPOST,
  ModelInfoResponseSchemaGET, ModelInfoResponseSchemaPOST
} from "api-specifications/modelInfo"
import Ajv, {ValidateFunction} from "ajv/dist/2020";
import addFormats from "ajv-formats";

export type INewModelSpecification = ModelInfo.POST.Request.Payload
const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
addFormats(ajv);// To support the "date-time" format
ajv.addSchema(LocaleSchema, LocaleSchema.$id);
ajv.addSchema(ModelInfoResponseSchemaGET, ModelInfoResponseSchemaGET.$id);
ajv.addSchema(ModelInfoRequestSchemaPOST, ModelInfoRequestSchemaPOST.$id);
ajv.addSchema(ModelInfoResponseSchemaPOST, ModelInfoResponseSchemaPOST.$id);
const responseValidatorGET: ValidateFunction = ajv.getSchema(ModelInfoResponseSchemaGET.$id as string) as ValidateFunction;
const responseValidatorPOST: ValidateFunction = ajv.getSchema(ModelInfoResponseSchemaPOST.$id as string) as ValidateFunction;

export default class ModelInfoService {

  readonly modelInfoEndpointUrl: string;
  readonly apiServerUrl: string;

  constructor(apiServerUrl: string) {
    this.modelInfoEndpointUrl = `${apiServerUrl}/models`
    this.apiServerUrl = apiServerUrl;
  }

  /**
   * Resolves with the modelID or rejects with a ServiceError
   *
   */
  public async createModel(newModelSpec: INewModelSpecification): Promise<string> {
    const errorFactory = getServiceErrorFactory("ModelInfoService", "createModel", "POST", this.modelInfoEndpointUrl);
    let response;
    let responseBody: string;
    const requestBody = JSON.stringify(newModelSpec);
    try {
      response = await fetch(this.modelInfoEndpointUrl, {
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
    if(!contentType?.includes("application/json")) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_HEADER, "Response Content-Type should be 'application/json'", `Content-Type header was ${contentType}`);
    }

    let modelResponse: ModelInfo.POST.Response.Payload;
    try {
      modelResponse = JSON.parse(responseBody);
    } catch (e: any) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not contain valid JSON", {responseBody, error: e});
    }
    const result = responseValidatorPOST(modelResponse);
    if (!result) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not conform to the expected schema", {responseBody: modelResponse, errors: responseValidatorPOST.errors});
    }

    return modelResponse.id;
  }
  public async getAllModels(): Promise<ModelDirectoryTypes.ModelInfo[]> {
    const errorFactory = getServiceErrorFactory("ModelInfoService", "getAllModels", "GET", this.modelInfoEndpointUrl);

    let response: Response;
    let responseBody: string;
    try {
      response = await fetch(this.modelInfoEndpointUrl, {
        method: 'GET',
        headers: {},
      });
      responseBody = await response.text();
    } catch (e) {
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Failed to fetch models", e)
    }

    if (response.status !== StatusCodes.OK) {
      // Server responded with a status code that indicates that the resource was not created
      // The responseBody should be an ErrorResponse but that is not guaranteed e.g. if a gateway in the middle returns a 502,
      // or if the server is not conforming to the error response schema
      throw errorFactory(response.status, ErrorCodes.API_ERROR, "Failed to fetch model", responseBody);
    }

    // Resource was created
    // Expect that the responseBody is a ModelResponse
    const contentType = response.headers.get("Content-Type");
    if (!contentType?.includes("application/json")) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_HEADER, "Response Content-Type should be 'application/json'", `Content-Type header was ${contentType}`);
    }
    let allModelsResponse: ModelInfo.GET.Response.Payload;
    try {
      allModelsResponse = JSON.parse(responseBody);
    } catch (e: any) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not contain valid JSON", {
        responseBody,
        error: e
      });
    }
    const result = responseValidatorGET(allModelsResponse);
    if (!result) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not conform to the expected schema", {
        responseBody: allModelsResponse,
        errors: responseValidatorGET.errors
      });
    }

    return allModelsResponse.map((modelInfo) => {
      return {
        id: modelInfo.id,
        UUID: modelInfo.UUID,
        previousUUID: modelInfo.previousUUID,
        originUUID: modelInfo.originUUID,
        name: modelInfo.name,
        description: modelInfo.description,
        locale: {
          UUID: modelInfo.locale.UUID,
          name: modelInfo.locale.name,
          shortCode: modelInfo.locale.shortCode
        },
        released: modelInfo.released,
        releaseNotes: modelInfo.releaseNotes,
        version: modelInfo.version,
        path: modelInfo.path,
        tabiyaPath: modelInfo.tabiyaPath,
        createdAt: new Date(modelInfo.createdAt),
        updatedAt: new Date(modelInfo.createdAt),
      } as ModelDirectoryTypes.ModelInfo;
    });
  }
}