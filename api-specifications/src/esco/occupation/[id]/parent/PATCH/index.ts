import PATCHOccupationParentErrors from "./enums";
import SchemaPATCHRequest from "./schema.request";
import SchemaPATCHResponse from "./schema.response";
import PATCHOccupationParentTypes from "./types";

namespace Detail.parent.PATCHOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPATCHRequest;
    }
    export namespace Response {
      export const Payload = SchemaPATCHResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = PATCHOccupationParentTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = PATCHOccupationParentTypes.Response.Payload;
    }
  }
  export import Errors = PATCHOccupationParentErrors;
}

export default Detail.parent.PATCHOperation;
