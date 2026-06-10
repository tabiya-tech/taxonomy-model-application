import OccupationGroupTypes from "../../../_shared/types";
import OccupationGroupEnums from "../../../_shared/enums";

namespace POSTOccupationGroupParentTypes {
  export namespace Request {
    export type Payload = {
      id: string;
      objectType: OccupationGroupEnums.Relations.Parent.ObjectTypes;
    };
  }
  export namespace Response {
    export type Payload = OccupationGroupTypes.Response.IOccupationGroup | null;
  }
}

export default POSTOccupationGroupParentTypes;
