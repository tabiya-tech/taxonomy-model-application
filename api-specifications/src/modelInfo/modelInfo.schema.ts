import {ModelInfoRequestSchemaPOST} from "./modelInfoRequestPOST";
import {ModelInfoResponseSchemaGET} from "./modelInfoResponseGET";
import {ModelInfoResponseSchemaPOST} from "./modelInfoResponsePOST";

export namespace ModelInfoSchema {
  export namespace POST {
    export const Request = ModelInfoRequestSchemaPOST;
    export const Response = ModelInfoResponseSchemaPOST;
  }

  export namespace GET {
    export const Response = ModelInfoResponseSchemaGET;
  }
}

