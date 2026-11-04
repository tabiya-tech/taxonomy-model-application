import PATCHOccupationGroupParentEnums from "./enums";
import SchemaPATCHRequest from "./schema.request";
import PATCHOccupationGroupParentTypes from "./types";
import SchemaPATCHResponse from "./schema.response";
import PATCHOccupationGroupParentConstants from "./constants";

namespace Detail.parent.PATCHOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPATCHRequest;
    }
    export namespace Response {
      export const Payload = SchemaPATCHResponse;
    }
  }
  export import Types = PATCHOccupationGroupParentTypes;
  export import Enums = PATCHOccupationGroupParentEnums;
  export import Constants = PATCHOccupationGroupParentConstants;
}

export default Detail.parent.PATCHOperation;
