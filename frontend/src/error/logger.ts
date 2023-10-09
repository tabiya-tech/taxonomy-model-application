/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { ServiceError } from "./error";

export function writeServiceErrorToLog(err: ServiceError, logFunction: (msg: any) => void): void {
  const logMessage = `ServiceError: ${err.serviceName} ${err.serviceFunction} ${err.errorCode} ${err.method} ${err.path} ${err.statusCode}`;
  const obj = {};
  for (const propertyName in err) {
    if (typeof err[propertyName] !== "function") {
      obj[propertyName] = err[propertyName];
    }
  }
  obj["message"] = err.message;
  obj["stack"] = err.stack;
  obj["class"] = err.name === "Error" ? err.constructor.name : err.name;
  logFunction(logMessage, obj);
}
