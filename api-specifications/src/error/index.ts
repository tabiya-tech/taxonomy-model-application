// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import ErrorSchema from "./schema";
import { GetErrorSchema } from "./get.schema";
import ErrorConstants from "./constants";
import ErrorTypes from "./types";
import ErrorSchemaPOST from "./schema.POST";
import ErrorSchemaGET from "./schema.GET";
import ErrorSchemaPATCH from "./schema.PATCH";

/**
 * This file should be imported in the following way

 import * as ErrorAPISpecs from "api-specifications/error";

 * And the general pattern is ErrorAPISpecs.{Schemas/Constants/Types}
 * It is also possible to get the common constants as APIError.Constants
 */

namespace ErrorSchemas {
  export const Payload = ErrorSchema;
  export const GetPayload = (
    method: ErrorTypes.METHODS,
    schemaName: string,
    code: ErrorTypes.Codes,
    errorCodes: string[]
  ) => GetErrorSchema(method, schemaName, code, errorCodes);
  export namespace POST {
    export const Payload = ErrorSchemaPOST;
  }
  export namespace GET {
    export const Payload = ErrorSchemaGET;
  }
  export namespace PATCH {
    export const Payload = ErrorSchemaPATCH;
  }
}

namespace ErrorAPISpecs {
  export import Constants = ErrorConstants;
  export import Types = ErrorTypes;
  export import Schemas = ErrorSchemas;
}

export default ErrorAPISpecs;
