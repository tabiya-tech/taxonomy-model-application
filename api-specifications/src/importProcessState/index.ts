// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import ImportProcessStateTypes from "./types";
import SchemaGETResponse from "./schema.GET.response";
import ImportProcessStateEnums from "./enums";

/**
 * This file should be imported in the following way

 import ImportProcessStateAPISpecs from "api-specifications/importProcessState";

 * And the general pattern is ImportProcessStateAPISpecs.{Schemas/Types/Enums}.[VERB].{Request/Response}
 */

namespace ImportProcessSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
  }
}

namespace ImportProcessStateAPISpecs {
  export import Enums = ImportProcessStateEnums;
  export import Types = ImportProcessStateTypes;
  export import Schemas = ImportProcessSchemas;
}

export default ImportProcessStateAPISpecs;
