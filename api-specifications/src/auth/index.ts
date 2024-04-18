// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import SchemaRequestContext from "./schema.Request.Context";
import AuthTypes from "./types";
import AuthEnums from "./enums";

/**
 * This file should be imported in the following way

 import AuthAPISpecs from "api-specifications/auth";

 * And the general pattern is AuthAPISpecs.{Schemas/Types}.[VERB].{Request/Response}
 */

namespace AuthSchemas {
  export namespace Request {
    export const Context = SchemaRequestContext;
  }
}

namespace AuthAPISpecs {
  export import Enums = AuthEnums;
  export import Types = AuthTypes;
  export import Schemas = AuthSchemas;
}

export default AuthAPISpecs;
