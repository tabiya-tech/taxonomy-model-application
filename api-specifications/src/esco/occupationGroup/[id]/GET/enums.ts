import { ObjectTypes as CommonGroupTypes } from "../../../common/objectTypes";

namespace GETOccupationGroupDetailEnums {
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

  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {}
    }
    export namespace Status404 {
      export enum ErrorCodes {
        OCCUPATION_GROUP_NOT_FOUND = "OCCUPATION_GROUP_NOT_FOUND",
        MODEL_NOT_FOUND = "GET_MODEL_NOT_FOUND",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_DETAIL = "DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_DETAIL",
      }
    }
  }
}
export default GETOccupationGroupDetailEnums;
