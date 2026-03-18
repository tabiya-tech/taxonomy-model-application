import OccupationEnums from "../_shared/enums";
import OccupationTypes from "../_shared/types";
import SchemaPOSTRequest from "./schema.request";
import SchemaPOSTResponse from "./schema.response";

// ─── POSTOccupation ───
namespace POSTOccupationOperation {
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
      export type Payload = OccupationTypes.POSTOccupation.Request.Payload;
    }
    export namespace Response {
      export type Payload = OccupationTypes.POSTOccupation.Response.Payload;
    }
  }
  export import Errors = OccupationEnums.POSTErrors;
}

export default POSTOccupationOperation;
