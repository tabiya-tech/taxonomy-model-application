// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import SchemaPOSTRequest from "./schema.POST.request";
import ExportConstants from "./constants";
import ExportTypes from "./types";
import ExportEnums from "./enums";

/**
 * This file should be imported in the following way

 import ExportAPISpecs from "api-specifications/export";

 * And the general pattern is ExportAPISpecs.{Schemas/Constants/Types/Enums}.[VERB].{Request/Response}
 * It is also possible to get the common constants as Export.Constants
 */

namespace ExportSchemas {
  export namespace POST {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
  }
}

namespace ExportAPISpecs {
  export import Enums = ExportEnums;
  export import Constants = ExportConstants;
  export import Types = ExportTypes;
  export import Schemas = ExportSchemas;
}
export default ExportAPISpecs;
