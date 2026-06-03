import OccupationEnums from "../../../_shared/enums";

namespace POSTOccupationParentTypes {
  export namespace Request {
    export type Payload = {
      parentId: string;
      parentType: OccupationEnums.Relations.Parent.ObjectTypes;
    };
  }
}

export default POSTOccupationParentTypes;
