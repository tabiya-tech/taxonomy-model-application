import OccupationTypes from "../../../_shared/types";
import OccupationGroupTypes from "../../../../occupationGroup/_shared/types";
import OccupationEnums from "../../../_shared/enums";

namespace POSTOccupationParentTypes {
  export namespace Request {
    export type Payload = {
      id: string;
      objectType: OccupationEnums.Relations.Parent.ObjectTypes;
    };
  }
  export namespace Response {
    export type Payload = OccupationTypes.Response.IOccupation | OccupationGroupTypes.Response.IOccupationGroup | null;
  }
}

export default POSTOccupationParentTypes;
