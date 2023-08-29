import ImportRequestSchemaPOST from "./import.schema";
import * as ImportConstants from "./import.constants";
import ImportTypes from "./import.types";

/**
 * This file should be imported in the following way

 import Import from "api-specifications/import";

 * And the general pattern is Import.[VERB].{Request/Response}
 * It is also possible to get the common constants as Import.Constants
 */

export { ImportConstants as Constants };

namespace Import {
  export const Constants = ImportConstants;
  export namespace POST {
    export namespace Request {
      export type Payload = ImportTypes.POST.Request.Payload;
      export type ImportFilePaths = ImportTypes.POST.Request.ImportFilePaths;
      export const Schema = ImportRequestSchemaPOST;
    }
    export namespace Response {
      export namespace Constants {
        export enum ImportResponseErrorCodes {
          FAILED_TO_TRIGGER_IMPORT = "FAILED_TO_TRIGGER_IMPORT"
        }
      }
    }
  }
}

export default Import;
