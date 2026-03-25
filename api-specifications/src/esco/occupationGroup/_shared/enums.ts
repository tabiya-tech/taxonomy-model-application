import { ObjectTypes as CommonGroupTypes } from "../../common/objectTypes";

namespace OccupationGroupEnums {
  export enum ObjectTypes {
    ISCOGroup = CommonGroupTypes.ISCOGroup,
    LocalGroup = CommonGroupTypes.LocalGroup,
  }

  export namespace Relations {
    export namespace Parent {
      export enum ObjectTypes {
        ISCOGroup = CommonGroupTypes.ISCOGroup,
        LocalGroup = CommonGroupTypes.LocalGroup,
      }
    }
    export namespace Children {
      export enum ObjectTypes {
        ISCOGroup = CommonGroupTypes.ISCOGroup,
        LocalGroup = CommonGroupTypes.LocalGroup,
        ESCOOccupation = CommonGroupTypes.ESCOOccupation,
        LocalOccupation = CommonGroupTypes.LocalOccupation,
      }
    }
  }
}

export default OccupationGroupEnums;
