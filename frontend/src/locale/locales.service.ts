import addFormats from "ajv-formats";
import Ajv, { ValidateFunction } from "ajv/dist/2020";
import { getServiceErrorFactory, ServiceErrorDetails } from "src/error/error";
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

    try {
      response = await fetchWithAuth(this.localesEndpointUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      responseBody = await response.text();
    } catch (error: unknown) {
      throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, "Failed to fetch locales", error as ServiceErrorDetails);
    }

    if (response.status !== StatusCodes.OK) {
      // Server responded with a status code that indicates that the resource was not OK
      // The responseBody should be an ErrorResponse but that is not guaranteed e.g. if a gateway in the middle returns a 502,
      // or if the server is not conforming to the error response schema
      throw errorFactory(response.status, ErrorCodes.API_ERROR, "Failed to fetch locales", responseBody);
    }

    // Resource was OK
    // Expect that the responseBody is a LocalesResponse
    const contentType = response.headers.get("Content-Type");
    if (!contentType?.includes("application/json")) {
      throw errorFactory(
        response.status,
        ErrorCodes.INVALID_RESPONSE_HEADER,
        "Response Content-Type should be 'application/json'",
        `Content-Type header was ${contentType}`
      );
    }

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
