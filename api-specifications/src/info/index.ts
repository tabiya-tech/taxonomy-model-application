import InfoResponseSchemaGET from "./Info.schema";
import InfoTypes from "./info.types";

/**
 * This file should be imported in the following way

 import Info from "api-specifications/info";

 * And the general pattern is Info.[VERB].{Request/Response}
 */

namespace Info {
  export namespace GET {
    export namespace Response {
      export type Payload = InfoTypes.GET.Response.Payload;
      export const Schema = InfoResponseSchemaGET;
    }
  }
}

export default Info;