import OccupationGroupGETParentTypes from "./types";
import GETOccupationGroupParentEnums from "./enums";
import SchemaGETOccupationGroupParentResponse from "./schema.parent.response";
import OccupationGroupParentGETConstants from "./constants";

namespace Detail.parent.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETOccupationGroupParentResponse;
    }
  }

  export import Types = OccupationGroupGETParentTypes;
  export import Enums = GETOccupationGroupParentEnums;
  export import Constants = OccupationGroupParentGETConstants;
}

export default Detail.parent.GETOperation;
