import { StatusCodes } from "http-status-codes";
import { ErrorCodes } from "src/error/errorCodes";
import { getServiceErrorFactory } from "src/error/error";

export type ExtendedRequestInit = RequestInit & {
  expectedStatusCode: number;
  serviceName: string;
  serviceFunction: string;
  failureMessage: string;
  expectedContentType?: string;
};
export const fetchWithAuth = async (
  apiUrl: string,
  init: ExtendedRequestInit = {
    expectedStatusCode: StatusCodes.OK,
    serviceName: "Unknown service",
    serviceFunction: "Unknown method",
    failureMessage: "Unknown error",
  }
): Promise<Response> => {
  const errorFactory = getServiceErrorFactory(
    init.serviceName,
    init.serviceFunction,
    init.method ?? "Unknown method",
    apiUrl
  );
  let response: Response;
  try {
    const token = sessionStorage.getItem("authToken");
    const headers = new Headers(init.headers || {});
    headers.append("Authorization", `Bearer ${token ?? "ANONYMOUS"}`);
    const enhancedInit = { headers };

    response = await fetch(apiUrl, enhancedInit);
  } catch (e: any) {
    throw errorFactory(0, ErrorCodes.FAILED_TO_FETCH, init.failureMessage, e);
  }
  // check if the server responded with the expected status code
  if (response.status !== init.expectedStatusCode) {
    // Server responded with a status code that indicates that the resource was not the expected one
    // The responseBody should be an ErrorResponse but that is not guaranteed e.g. if a gateway in the middle returns a 502,
    // or if the server is not conforming to the error response schema
    const responseBody = await response.text();
    throw errorFactory(response.status, ErrorCodes.API_ERROR, init.failureMessage, responseBody);
  }
  // check if the response is in the expected format
  const responseContentType = response.headers.get("Content-Type");
  // @ts-ignore
  if (init.expectedContentType && !responseContentType?.includes(init.expectedContentType)) {
    throw errorFactory(
      response.status,
      ErrorCodes.INVALID_RESPONSE_HEADER,
      "Response Content-Type should be 'application/json'",
      `Content-Type header was ${responseContentType}`
    );
  }
  return response;
};
