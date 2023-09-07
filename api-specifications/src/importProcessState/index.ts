// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import ImportProcessStateTypes from "./types";
import SchemaGETResponse from "./schema.GET.response";
import ImportProcessStateEnums from "./enums";
import {ImportProcessStateConstants} from "./constants";

/**
 * This file should be imported in the following way

 import Info from "api-specifications/info";

 * And the general pattern is Info.[VERB].{Request/Response}
 */

namespace ImportProcessSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
  }
}

namespace ImportProcessState {
  export import Enums = ImportProcessStateEnums;
  export import Constants = ImportProcessStateConstants;
  export import Types = ImportProcessStateTypes;
  export import Schemas = ImportProcessSchemas;
}

export default ImportProcessState;