import POSTOccupationGroupParentEnums from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTOccupationGroupParentTypes from "./types";
import SchemaPOSTResponse from "./schema.response";
import POSTOccupationGroupParentConstants from "./constants";

namespace Detail.parent.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }
  }
  export import Types = POSTOccupationGroupParentTypes;
  export import Enums = POSTOccupationGroupParentEnums;
  export import Constants = POSTOccupationGroupParentConstants;
}
export default Detail.parent.POSTOperation;
