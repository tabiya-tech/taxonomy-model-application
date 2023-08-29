import {ModelInfoConstants} from "./modelInfo.constants";
import ModelInfoTypes from "./modelInfo.types";

import ModelInfoResponseSchemaGET from "./modelInfo.GET.response.schema";
import ModelInfoRequestSchemaPOST from "./modelInfo.POST.request.schema";
import ModelInfoResponseSchemaPOST from "./modelInfo.POST.response.schema";

/**
  * This file should be imported in the following way

    import ModelInfo from "api-specifications/modelInfo";

  * And the general pattern is ModelInfo.[VERB].{Request/Response}
  * It is also possible to get the common constants as ModelInfo.Constants
 */

export { ModelInfoConstants as Constants };

namespace ModelInfo {
  export const Constants = ModelInfoConstants;
  export namespace GET {
    export namespace Response {
      export type Payload = Array<ModelInfoTypes.GET.Response.Payload>
      export const Schema = ModelInfoResponseSchemaGET;

      export namespace Constants {
        export enum ErrorCodes {
          DB_FAILED_TO_RETRIEVE_MODELS = "DB_FAILED_TO_RETRIEVE_MODELS"
        }
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export type Payload = ModelInfoTypes.POST.Response.Payload;
      export const Schema = ModelInfoResponseSchemaPOST;

      export namespace Constants {
        export enum ErrorCodes {
          DB_FAILED_TO_CREATE_MODEL = "DB_FAILED_TO_CREATE_MODEL",
          MODEL_COULD_NOT_VALIDATE = "MODEL_COULD_NOT_VALIDATE",
        }
      }
    }
    export namespace Request {
      export type Payload = ModelInfoTypes.POST.Request.Payload;
      export const Schema = ModelInfoRequestSchemaPOST;
    }
  }
}
export default ModelInfo;