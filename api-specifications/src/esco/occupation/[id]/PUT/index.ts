import OccupationEnums from "../../_shared/enums";
import OccupationTypes from "../../_shared/types";
import PUTOccupationErrors from "./enums";
import PUTOccupationConstants from "./constants";
import SchemaPUTRequest from "./schema.request";
import SchemaPUTResponse from "./schema.response";

namespace PUTOccupationOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPUTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPUTResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = OccupationTypes.Detail.PUT.Request.Payload;
    }
    export namespace Response {
      export type Payload = OccupationTypes.Detail.PUT.Response.Payload;
    }
  }
  export import Errors = PUTOccupationErrors;
  export import Constants = PUTOccupationConstants;
  export import Enums = OccupationEnums;
}

export default PUTOccupationOperation;
