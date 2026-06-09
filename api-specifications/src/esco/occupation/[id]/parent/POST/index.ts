import POSTOccupationParentErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTOccupationParentTypes from "./types";
import OccupationTypes from "../../../_shared/types";
import SchemaGETParentResponse from "../GET/schema.response";

namespace Detail.parent.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
    export namespace Response {
      export const Payload = SchemaGETParentResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = POSTOccupationParentTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = OccupationTypes.Detail.parent.GET.Response.Payload;
    }
  }
  export import Errors = POSTOccupationParentErrors;
}

export default Detail.parent.POSTOperation;
