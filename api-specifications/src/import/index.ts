// we need to disable the eslint rule here because this is a top level export
/* eslint-disable @typescript-eslint/no-unused-vars */

import SchemaPOSTRequest from "./schema.POST.request";
import ImportConstants from "./constants";
import ImportTypes from "./types";
import ImportEnums from "./enums";

/**
 * This file should be imported in the following way

 import ImportAPISpecs from "api-specifications/import";

 * And the general pattern is ImportAPISpecs.{Schemas/Constants/Types/Enums}.[VERB].{Request/Response}
 * It is also possible to get the common constants as Import.Constants
 */

namespace ImportSchemas {
  export namespace POST {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
  }
}

namespace ImportAPISpecs {
  export import Enums = ImportEnums;
  export import Constants = ImportConstants;
  export import Types = ImportTypes;
  export import Schemas = ImportSchemas;
}
export default ImportAPISpecs;
