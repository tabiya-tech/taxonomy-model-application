import PresignedResponseSchemaGET from "./presigned.schema";
import PresignedTypes from "./presigned.types";
import {PresignedConstants} from "./presigned.constants";

/**
 * This file should be imported in the following way

 import as Presigned from "api-specifications/presigned";

 * And the general pattern is Presigned.[VERB].{Request/Response}
 * It is also possible to get the common constants as Presigned.Constants
 */

export { PresignedConstants as Constants };

namespace Presigned {
  export const Constants = PresignedConstants;
  export namespace GET {
    export namespace Response {
      export type Payload = PresignedTypes.GET.Response.Payload
      export const Schema = PresignedResponseSchemaGET;
    }
  }
}

export default Presigned;