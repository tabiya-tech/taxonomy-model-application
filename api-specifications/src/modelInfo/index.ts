// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import ModelInfoConstants from "./constants";
import ModelInfoTypes from "./types";

import SchemaGETResponse from "./schema.GET.response";
import SchemaPOSTRequest from "./schema.POST.request";
import SchemaPOSTResponse from "./schema.POST.response";
import ModelInfoEnums from "./enums";

/**
  * This file should be imported in the following way

    import ModelInfoAPISpecs from "api-specifications/modelInfo";

  * And the general pattern is ModelInfoAPISpecs.{Schemas/Types/Enums/Constants}.[VERB].{Request/Response}
 */

namespace ModelInfoSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
  }
  export namespace POST {
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
  }
}

namespace ModelInfoAPISpecs {
  export import Enums = ModelInfoEnums;
  export import Constants = ModelInfoConstants;
  export import Types = ModelInfoTypes;
  export import Schemas = ModelInfoSchemas;
}

export default ModelInfoAPISpecs;