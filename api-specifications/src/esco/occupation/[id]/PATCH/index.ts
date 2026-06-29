import OccupationEnums from "../../_shared/enums";
import OccupationTypes from "../../_shared/types";
import PATCHOccupationErrors from "./enums";
import PATCHOccupationConstants from "./constants";
import SchemaPATCHRequest from "./schema.request";
import SchemaPATCHResponse from "./schema.response";

namespace PATCHOccupationOperation {
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
      export type Payload = OccupationTypes.Detail.PATCH.Request.Payload;
    }
    export namespace Response {
      export type Payload = OccupationTypes.Detail.PATCH.Response.Payload;
    }
  }
  export import Errors = PATCHOccupationErrors;
  export import Constants = PATCHOccupationConstants;
  export import Enums = OccupationEnums;
}

export default PATCHOccupationOperation;
