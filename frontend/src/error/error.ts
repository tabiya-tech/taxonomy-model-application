import APIError from "api-specifications/error";
import {ErrorCodes} from "./errorCodes";

type ServiceErrorDetails = string | APIError.POST.Response.Payload | any;
export class ServiceError extends Error {
  serviceName: string;
  serviceFunction: string;
  method: string;
  path: string;
  statusCode: number;
  errorCode: ErrorCodes;
  details: ServiceErrorDetails;

  constructor(serviceName: string, serviceFunction: string, method: string, path: string, statusCode: number, errorCode: ErrorCodes, message: string, details?: ServiceErrorDetails) {
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
    if (typeof details === 'string') {
      try {
        this.details = JSON.parse(details);
      } catch (e) {
        this.details = details;
      }
    }else {
      this.details = details;
    }
  }
}

//factory function
export interface ServiceErrorFactory {
  (statusCode: number, errorCode: ErrorCodes, message: string, details?: ServiceErrorDetails): ServiceError
}


export function getServiceErrorFactory(serviceName: string, serviceFunction: string, method: string, path: string): ServiceErrorFactory {
  return (statusCode: number, errorCode: ErrorCodes, message: string, details?: ServiceErrorDetails): ServiceError => {
    return new ServiceError(serviceName, serviceFunction, method, path, statusCode, errorCode, message, details);
  };
}



