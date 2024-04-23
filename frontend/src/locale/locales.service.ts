import addFormats from "ajv-formats";
import Ajv, { ValidateFunction } from "ajv/dist/2020";
import { getServiceErrorFactory } from "src/error/error";
import { ErrorCodes } from "src/error/errorCodes";
import { StatusCodes } from "http-status-codes/";
import LocaleAPISpecs from "api-specifications/locale";
import { fetchWithAuth } from "src/apiService/APIService";

const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
addFormats(ajv); // To support the "date-time" format
ajv.addSchema(LocaleAPISpecs.Schemas.Payload, LocaleAPISpecs.Schemas.Payload.$id);
const responseValidator: ValidateFunction = ajv.getSchema(
  LocaleAPISpecs.Schemas.Payload.$id as string
) as ValidateFunction;

export default class LocalesService {
  readonly localesEndpointUrl: string;
  readonly apiServerUrl: string;

  constructor(apiServerUrl: string) {
    this.localesEndpointUrl = `${apiServerUrl}/locales.json`;
    this.apiServerUrl = apiServerUrl;
  }

  /**
   *
   * Resolves with a LocalesResponse or rejects with a ServiceError
   *
   * **/
  async getLocales(): Promise<LocaleAPISpecs.Types.Payload[]> {
    const errorFactory = getServiceErrorFactory("LocalesService", "getLocales", "GET", this.localesEndpointUrl);

    let response: Response;
    let responseBody: string;
    response = await fetchWithAuth(this.localesEndpointUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      expectedStatusCode: StatusCodes.OK,
      serviceName: "LocalesService",
      serviceFunction: "getLocales",
      failureMessage: "Failed to fetch locales",
      expectedContentType: "application/json",
    });
    responseBody = await response.text();

    let localesResponse: LocaleAPISpecs.Types.Payload[];
    try {
      localesResponse = JSON.parse(responseBody);
    } catch (error: unknown) {
      throw errorFactory(response.status, ErrorCodes.INVALID_RESPONSE_BODY, "Response did not contain valid JSON", {
        responseBody,
        error: error,
      });
    }

    for (const locale of localesResponse) {
      const result = responseValidator(locale);

      if (!result) {
        throw errorFactory(
          response.status,
          ErrorCodes.INVALID_RESPONSE_BODY,
          "Response did not conform to the expected schema",
          {
            responseBody: locale,
            errors: responseValidator.errors,
          }
        );
      }
    }
    return localesResponse;
  }
}
