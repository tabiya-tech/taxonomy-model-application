import PUTOccupationGroupParentEnums from "./enums";
import SchemaPUTRequest from "./schema.request";
import PUTOccupationGroupParentTypes from "./types";
import SchemaPUTResponse from "./schema.response";
import PUTOccupationGroupParentConstants from "./constants";

namespace Detail.parent.PUTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPUTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPUTResponse;
    }
  }
  export import Types = PUTOccupationGroupParentTypes;
  export import Enums = PUTOccupationGroupParentEnums;
  export import Constants = PUTOccupationGroupParentConstants;
}

export default Detail.parent.PUTOperation;
