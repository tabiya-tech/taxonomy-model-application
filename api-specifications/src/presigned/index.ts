// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import SchemaGETResponse from "./schema.GET.response";
import PresignedTypes from "./types";
import PresignedConstants from "./constants";

/**
 * This file should be imported in the following way

 import as PresignedAPISpecs from "api-specifications/presigned";

 * And the general pattern is PresignedAPISpecs.{Schemas/Types/Constants}[VERB].{Request/Response}
 */


namespace PresignedSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
  }
}

namespace PresignedAPISpecs {
  export import Constants = PresignedConstants;
  export import Types = PresignedTypes;
  export import Schemas = PresignedSchemas;
}

export default PresignedAPISpecs;