import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { getServiceErrorFactory, ServiceError } from "src/error/error";
import { ErrorCodes } from "src/error/errorCodes";
import { StatusCodes } from "http-status-codes/";
import LocaleAPISpecs from "api-specifications/locale";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import Ajv, { ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { fetchWithAuth } from "src/apiService/APIService";

export type INewModelSpecification = ModelInfoAPISpecs.Types.POST.Request.Payload;
const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
addFormats(ajv); // To support the "date-time" format
ajv.addSchema(LocaleAPISpecs.Schemas.Payload, LocaleAPISpecs.Schemas.Payload.$id);
ajv.addSchema(ModelInfoAPISpecs.Schemas.GET.Response.Payload, ModelInfoAPISpecs.Schemas.GET.Response.Payload.$id);
ajv.addSchema(ModelInfoAPISpecs.Schemas.POST.Response.Payload, ModelInfoAPISpecs.Schemas.POST.Response.Payload.$id);
ajv.addSchema(ModelInfoAPISpecs.Schemas.POST.Request.Payload, ModelInfoAPISpecs.Schemas.POST.Request.Payload.$id);
const responseValidatorGET: ValidateFunction = ajv.getSchema(
  ModelInfoAPISpecs.Schemas.GET.Response.Payload.$id as string
) as ValidateFunction;
const responseValidatorPOST: ValidateFunction = ajv.getSchema(
  ModelInfoAPISpecs.Schemas.POST.Response.Payload.$id as string
) as ValidateFunction;

/**
 * Extracts the type of the elements of an array.
 */
type PayloadItem<ArrayOfItemType extends Array<unknown>> = ArrayOfItemType extends (infer ItemType)[]
  ? ItemType
  : never;
type ModelInfoTypeAPISpecs =
  | PayloadItem<ModelInfoAPISpecs.Types.GET.Response.Payload>
  | ModelInfoAPISpecs.Types.POST.Response.Payload;
export const UPDATE_INTERVAL = 10000; // In milliseconds

export default class ModelInfoService {
  readonly modelInfoEndpointUrl: string;
  readonly apiServerUrl: string;

  constructor(apiServerUrl: string) {
    this.modelInfoEndpointUrl = `${apiServerUrl}/models`;
    this.apiServerUrl = apiServerUrl;
  }

  /**
   * Resolves with the modelID or rejects with a ServiceError
   *
   */
  public async createModel(newModelSpec: INewModelSpecification): Promise<ModelInfoTypes.ModelInfo> {
    const serviceName = "ModelInfoService";
    const serviceFunction = "createModel";
    const method = "POST";
    const errorFactory = getServiceErrorFactory(serviceName, serviceFunction, method, this.modelInfoEndpointUrl);
    let response;
    let responseBody: string;
    const requestBody = JSON.stringify(newModelSpec);
    response = await fetchWithAuth(this.modelInfoEndpointUrl, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
      expectedStatusCode: StatusCodes.CREATED,
      serviceName: serviceName,
      serviceFunction: serviceFunction,
      failureMessage: "Failed to create a new model",
      expectedContentType: "application/json",
    });
    responseBody = await response.text();

    let modelResponse: ModelInfoAPISpecs.Types.POST.Response.Payload;
    try {
      modelResponse = JSON.parse(responseBody);
    } catch (e: any) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not contain valid JSON", {
        responseBody,
        error: e,
      });
    }
    const result = responseValidatorPOST(modelResponse);
    if (!result) {
      throw errorFactory(
        response.status,
        ErrorCodes.INVALID_RESPONSE_BODY,
        "Response did not conform to the expected schema",
        {
          responseBody: modelResponse,
          errors: responseValidatorPOST.errors,
        }
      );
    }

    return this.transform(modelResponse);
  }

  public async getAllModels(): Promise<ModelInfoTypes.ModelInfo[]> {
    const serviceName = "ModelInfoService";
    const serviceFunction = "getAllModels";
    const method = "GET";
    const errorFactory = getServiceErrorFactory(serviceName, serviceFunction, method, this.modelInfoEndpointUrl);

    let response: Response;
    let responseBody: string;
    response = await fetchWithAuth(this.modelInfoEndpointUrl, {
      method: method,
      headers: {},
      expectedStatusCode: StatusCodes.OK,
      serviceName: serviceName,
      serviceFunction: serviceFunction,
      failureMessage: "Failed to fetch all models",
      expectedContentType: "application/json",
    });
    responseBody = await response.text();

    let allModelsResponse: ModelInfoAPISpecs.Types.GET.Response.Payload;
    try {
      allModelsResponse = JSON.parse(responseBody);
    } catch (e: any) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not contain valid JSON", {
        responseBody,
        error: e,
      });
    }
    const result = responseValidatorGET(allModelsResponse);
    if (!result) {
      throw errorFactory(
        response.status,
        ErrorCodes.INVALID_RESPONSE_BODY,
        "Response did not conform to the expected schema",
        {
          responseBody: allModelsResponse,
          errors: responseValidatorGET.errors,
        }
      );
    }

    return allModelsResponse.map(this.transform);
  }

  private _callGetAllModels(state: {
    onSuccessCallback: (models: ModelInfoTypes.ModelInfo[]) => void;
    onErrorCallBack: (error: ServiceError | Error) => void;
    isFetching: boolean;
  }) {
    state.isFetching = true;
    this.getAllModels()
      .then(
        (models) => {
          state.onSuccessCallback(models);
        },
        (e: ServiceError) => {
          state.onErrorCallBack(e);
        }
      )
      .finally(() => {
        state.isFetching = false;
      });
  }

  public fetchAllModelsPeriodically(
    onSuccessCallback: (models: ModelInfoTypes.ModelInfo[]) => void,
    onErrorCallBack: (error: ServiceError | Error) => void
  ) {
    const state = {
      onSuccessCallback,
      onErrorCallBack,
      isFetching: false,
    };
    this._callGetAllModels(state);

    // Fetch the models periodically
    return setInterval(() => {
      if (state.isFetching) {
        console.info("Skipping fetching the models, because a fetch is already in progress.");
        return;
      }
      this._callGetAllModels(state);
    }, UPDATE_INTERVAL);
  }

  transform(payloadItem: ModelInfoTypeAPISpecs): ModelInfoTypes.ModelInfo {
    return {
      ...payloadItem,
      exportProcessState: payloadItem.exportProcessState.map((exportProcessState) => {
        return {
          ...exportProcessState,
          timestamp: new Date(exportProcessState.timestamp),
          createdAt: new Date(exportProcessState.createdAt),
          updatedAt: new Date(exportProcessState.updatedAt),
        };
      }),
      importProcessState: {
        ...payloadItem.importProcessState,
        createdAt: payloadItem.importProcessState.createdAt
          ? new Date(payloadItem.importProcessState.createdAt)
          : undefined,
        updatedAt: payloadItem.importProcessState.updatedAt
          ? new Date(payloadItem.importProcessState.updatedAt)
          : undefined,
      },
      createdAt: new Date(payloadItem.createdAt),
      updatedAt: new Date(payloadItem.updatedAt),
    };
  }
}
