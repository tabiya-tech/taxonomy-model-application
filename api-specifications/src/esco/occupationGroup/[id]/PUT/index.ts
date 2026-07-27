import SchemaPUTRequest from "./schema.request";
import SchemaPUTResponse from "./schema.response";
import OccupationGroupEnums from "../../_shared/enums";
import OccupationGroupTypes from "../../_shared/types";
import PUTOccupationGroupErrors from "./enums";
import OccupationGroupPUTConstants from "./constants";

namespace PUTOccupationGroupOperation {
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
      export type Payload = OccupationGroupTypes.Detail.PUT.Request.Payload;
    }
    export namespace Response {
      export type Payload = OccupationGroupTypes.Detail.PUT.Response.Payload;
    }
  }
  export import Errors = PUTOccupationGroupErrors;
  export import Constants = OccupationGroupPUTConstants;
  export import Enums = OccupationGroupEnums;
}

export default PUTOccupationGroupOperation;
