// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import SchemaGETResponse from "./schema.GET.response";
import InfoTypes from "./types";

/**
 * This file should be imported in the following way

 import InfoAPISpecs from "api-specifications/info";

 * And the general pattern is InfoAPISpecs.{Schemas/Types}.[VERB].{Request/Response}
 */

namespace InfoSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
  }
}

namespace InfoAPISpecs {
  export import Types = InfoTypes;
  export import Schemas = InfoSchemas;
}

export default InfoAPISpecs;
