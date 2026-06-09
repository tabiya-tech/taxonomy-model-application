import POSTOccupationParentErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTOccupationParentTypes from "./types";

namespace Detail.parent.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = POSTOccupationParentTypes.Request.Payload;
    }
  }
  export import Errors = POSTOccupationParentErrors;
}

export default Detail.parent.POSTOperation;
