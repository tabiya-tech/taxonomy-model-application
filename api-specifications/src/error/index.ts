// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import ErrorSchema from "./schema";
import ErrorConstants from "./constants";
import ErrorTypes from "./types";

/**
 * This file should be imported in the following way

 import * as ErrorAPISpecs from "api-specifications/error";

 * And the general pattern is ErrorAPISpecs.{Schemas/Constants/Types}
 * It is also possible to get the common constants as APIError.Constants
 */


namespace ErrorSchemas {
      export const Payload = ErrorSchema;
}

namespace ErrorAPISpecs {
  export import Constants = ErrorConstants;
  export import Types = ErrorTypes;
  export import Schemas = ErrorSchemas;
}

export default ErrorAPISpecs;
