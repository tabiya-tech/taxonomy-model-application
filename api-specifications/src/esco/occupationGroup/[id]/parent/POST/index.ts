import POSTOccupationGroupParentEnums from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTOccupationGroupParentTypes from "./types";
import SchemaPOSTResponse from "./schema.response";

namespace Detail.parent.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = POSTOccupationGroupParentTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = POSTOccupationGroupParentTypes.Response.Payload;
    }
  }
  export import Enums = POSTOccupationGroupParentEnums;
}
export default Detail.parent.POSTOperation;
