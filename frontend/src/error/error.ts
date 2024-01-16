import ErrorAPISpecs from "api-specifications/error";
import { ErrorCodes } from "./errorCodes";
import { StatusCodes } from "http-status-codes/";

type ServiceErrorDetails = string | ErrorAPISpecs.Types.Payload | any; // NOSONAR

export const USER_FRIENDLY_ERROR_MESSAGES = {
  REQUEST_TOO_LONG:
    "The data sent to the service seems to be to large. " +
    "Please try again with a smaller payload. " +
    "If the problem persists, clear your browser's cache and refresh the page.",
  TOO_MANY_REQUESTS: "It looks like you are making too many requests. Please slow down and try again later.",
  UNEXPECTED_ERROR: "An unexpected error occurred. Please try again later.",
  SERVER_CONNECTION_ERROR: "Cannot connect to the service. Please check your internet connection or try again later.",
  RESOURCE_NOT_FOUND: "The requested resource was not found. Please clear your browser's cache and refresh the page.",
  AUTHENTICATION_FAILURE: "It looks like you not logged in. Please log in to continue.",
  PERMISSION_DENIED: "It looks like you do not have the necessary permissions. Please log out and log in again.",
  UNABLE_TO_PROCESS_RESPONSE:
    "We encountered an issue while processing data. Clear the browser's cache and refresh or try again later.",
  SERVICE_UNAVAILABLE: "The service is currently unavailable. Please try again later.",
  DATA_VALIDATION_ERROR:
    "There seems to be an issue with your request. " +
    "If you're submitting data, please make sure they're valid and try again. " +
    "If the problem persists, clear your browser's cache and refresh the page.",
};

export class ServiceError extends Error {
  serviceName: string;
  serviceFunction: string;
  method: string;
  path: string;
  statusCode: number;
  errorCode: ErrorCodes;
  details: ServiceErrorDetails;

  constructor(
    serviceName: string,
    serviceFunction: string,
    method: string,
    path: string,
    statusCode: number,
    errorCode: ErrorCodes,
    message: string,
    details?: ServiceErrorDetails
  ) {
    super(message);
    this.serviceName = serviceName;
    this.serviceFunction = serviceFunction;
    this.method = method;
    this.path = path;
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // if the details is an object, or a JSON representation of an object,
    // then add it as an object to the details property,
    // otherwise just add the details as a string
    if (typeof details === "string") {
      try {
        this.details = JSON.parse(details);
      } catch (e) {
        this.details = details;
      }
    } else {
      this.details = details;
    }
  }
}

//factory function
export type ServiceErrorFactory = (
  statusCode: number,
  errorCode: ErrorCodes,
  message: string,
  details?: ServiceErrorDetails
) => ServiceError;

export function getServiceErrorFactory(
  serviceName: string,
  serviceFunction: string,
  method: string,
  path: string
): ServiceErrorFactory {
  return (statusCode: number, errorCode: ErrorCodes, message: string, details?: ServiceErrorDetails): ServiceError => {
    return new ServiceError(serviceName, serviceFunction, method, path, statusCode, errorCode, message, details);
  };
}

/**
 * @param {ServiceError} error
 * @returns {string} a user friendly error message
 */

export const getUserFriendlyErrorMessage = (error: ServiceError | Error): string => {
  if (!(error instanceof ServiceError)) {
    // in case the error is not a ServiceError, then it is an unexpected error
    return USER_FRIENDLY_ERROR_MESSAGES.UNEXPECTED_ERROR;
  }
  // All the errors can happen due to a bug in the frontend or backend code.
  // In that case, the users can do little about it, but there might be some cases where a workaround is possible.
  // In other cases, the errors occur due to some temporary issue, e.g. the server is down, the internet connection is down, new version deployed etc.
  // The user-friendly error messages should be written in a way that the user can understand what happened and what they can do about it.
  switch (error.errorCode) {
    case ErrorCodes.FAILED_TO_FETCH:
      // The frontend could not establish a connection to the server.
      // This can happen when:
      // - the internet is down
      // - the server is not reachable
      // - slow internet connection and the request timed out
      // - the server is very slow and the request timed out
      // - browser has extensions that block the connection
      // - browser has run out of resources
      // What can the user do:
      // - check the internet connection
      // - try again later
      // - restart or try a different browser
      // - disable browser extensions

      // MESSAGE: Connection to the server cannot be established. Please try the following:
      // - check your internet connection or
      // - disable browser extensions or
      // - restart or try a different browser or
      // - try again later
      return USER_FRIENDLY_ERROR_MESSAGES.SERVER_CONNECTION_ERROR;

    case ErrorCodes.API_ERROR:
      if (error.statusCode >= 300 && error.statusCode < 400) {
        // The API has moved.
        // This can happen when:
        // - the user is using an old version of the app
        // What can the user do :
        // - refresh the page to get the latest version of the app
        // - clear the browser cache to get the latest version of the app
        // - if the problem persists, contact support
        return USER_FRIENDLY_ERROR_MESSAGES.UNABLE_TO_PROCESS_RESPONSE;
      }
      switch (error.statusCode) {
        case StatusCodes.UNAUTHORIZED:
          // The user is not authenticated.
          // This can happen when:
          // - the user is not logged in
          // - the user's was "logged" out (token expired, user deleted, etc.)
          // What can the user do :
          // - login
          return USER_FRIENDLY_ERROR_MESSAGES.AUTHENTICATION_FAILURE;
        case StatusCodes.FORBIDDEN:
          // The user is not authorized to perform this action.
          // This can happen when:
          // - the user permissions have changed and the UI has not been updated
          // What can the user do:
          // - logout and login again
          return USER_FRIENDLY_ERROR_MESSAGES.PERMISSION_DENIED;
        case StatusCodes.NOT_FOUND:
          // This happens when:
          // - the user is using an old version of the app
          // - the resource that the user is trying to access has been deleted
          return USER_FRIENDLY_ERROR_MESSAGES.RESOURCE_NOT_FOUND;
        case StatusCodes.TOO_MANY_REQUESTS:
          // This happens when:
          // - the user is making too many requests in a short time
          // What can the user do:
          // - try again later
          return USER_FRIENDLY_ERROR_MESSAGES.TOO_MANY_REQUESTS;
        case StatusCodes.REQUEST_TOO_LONG:
          // This happens when:
          // - the user is sending a payload that exceeds the server's limit
          // - a bug could prohibit the  client to validate the payload correctly,
          // - a validation was not implemented
          // - the user is using an old version of the app and the API has changed
          // What can the user do:
          // - retry with a smaller payload
          // - try again later
          // - refresh the page to get the latest version of the app
          // - clear the browser cache to get the latest version of the app
          return USER_FRIENDLY_ERROR_MESSAGES.REQUEST_TOO_LONG;
      }
      if (error.statusCode >= 400 && error.statusCode < 500) {
        // The server could not or not willing to handle the request
        //  e.g. the request payload or header are invalid, the endpoint does not exist, some consistency violation occurred etc.
        // This can happen when:
        // - missing client validation allows the user to enter invalid data
        // - the client is using older data and the model has changed in the meantime
        // - the user is using an old version of the app and the API has changed
        // - the server refuses to handle the load e.g. too many requests
        // What can the user do:
        // - check the data they entered and try again
        // - refresh the page to get the latest version of the app
        // - clear the browser cache to get the latest version of the app
        // - try again later
        return USER_FRIENDLY_ERROR_MESSAGES.DATA_VALIDATION_ERROR;
      }
      if (error.statusCode === 500) {
        // Server encountered an unexpected condition.
        // This can happen when:
        // - an unexpected error occurred on the server
        // What can the user do:
        // -  try again later
        return USER_FRIENDLY_ERROR_MESSAGES.UNEXPECTED_ERROR;
      }
      if (error.statusCode >= 501) {
        // Server encountered an unexpected condition.
        // This can happen when:
        // - an unexpected error occurred on the server
        // - some part of the infrastructure is down e.g. the gateway, the database, etc.
        // What can the user do:
        // -  try again later
        return USER_FRIENDLY_ERROR_MESSAGES.SERVICE_UNAVAILABLE;
      }
      break;

    case ErrorCodes.INVALID_RESPONSE_BODY:
    case ErrorCodes.INVALID_RESPONSE_HEADER:
      // The frontend could not handle the response.
      // This can happen when:
      // - the API has changed and the user is using an old version of the app
      // What can the user do:
      // - refresh the page to get the latest version of the app
      // - clear the browser cache to get the latest version of the app
      return USER_FRIENDLY_ERROR_MESSAGES.UNABLE_TO_PROCESS_RESPONSE;
  }
  // If we get here, then
  // - we messed and don't know what the error is, or
  // - additional error codes where introduced, and we forgot to handle them
  return USER_FRIENDLY_ERROR_MESSAGES.UNEXPECTED_ERROR;
};
