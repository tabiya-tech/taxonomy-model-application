import SchemaPATCHRequest from "./schema.request";
import SchemaPATCHResponse from "./schema.response";
import OccupationGroupEnums from "../../_shared/enums";
import OccupationGroupTypes from "../../_shared/types";
import PATCHOccupationGroupErrors from "./enums";
import OccupationGroupPATCHConstants from "./constants";

namespace PATCHOccupationGroupOperation {
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
      export type Payload = OccupationGroupTypes.Detail.PATCH.Request.Payload;
    }
    export namespace Response {
      export type Payload = OccupationGroupTypes.Detail.PATCH.Response.Payload;
    }
  }
  export import Errors = PATCHOccupationGroupErrors;
  export import Constants = OccupationGroupPATCHConstants;
  export import Enums = OccupationGroupEnums;
}

export default PATCHOccupationGroupOperation;
