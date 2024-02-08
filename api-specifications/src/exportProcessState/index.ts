// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import SchemaGETResponse from "./schema.GET.response";
import ExportProcessStateEnums from "./enums";
import ExportProcessStateTypes from "./types";
import ExportProcessStateConstants from "./constants";

/**
 * This file should be imported in the following way

 import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";

 * And the general pattern is ExportProcessStateAPISpecs.{Schemas/Types/Enums}.[VERB].{Request/Response}
 */

namespace ExportProcessSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
  }
}

namespace ExportProcessStateAPISpecs {
  export import Enums = ExportProcessStateEnums;
  export import Constants = ExportProcessStateConstants;
  export import Types = ExportProcessStateTypes;
  export import Schemas = ExportProcessSchemas;
}

export default ExportProcessStateAPISpecs;
