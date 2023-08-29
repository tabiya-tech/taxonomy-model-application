import ErrorResponseSchemaPOST from "./error.schema";
import * as ErrorConstants from "./error.constants";
import ErrorTypes from "./error.types";

/**
 * This file should be imported in the following way

 import * as APIError from "api-specifications/error";

 * And the general pattern is APIError.[VERB].{Request/Response}
 * It is also possible to get the common constants as APIError.Constants
 */


export { ErrorConstants as Constants };

namespace APIError {
  export const Constants = ErrorConstants;
  export namespace POST {
    export namespace Response {
      export type Payload = ErrorTypes.POST.Response.Payload;
      export const Schema = ErrorResponseSchemaPOST;
    }
  }
}

export default APIError;
