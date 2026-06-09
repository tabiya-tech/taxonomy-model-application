import OccupationEnums from "../../../_shared/enums";

namespace POSTOccupationParentTypes {
  export namespace Request {
    export type Payload = {
      id: string;
      objectType: OccupationEnums.Relations.Parent.ObjectTypes;
    };
  }
}

export default POSTOccupationParentTypes;
