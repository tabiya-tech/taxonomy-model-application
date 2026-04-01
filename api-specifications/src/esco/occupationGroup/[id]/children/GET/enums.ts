import { ObjectTypes as CommonGroupTypes } from "../../../../common/objectTypes";

namespace OccupationGroupChildrenEnums {
  export enum ObjectTypes {
    ISCOGroup = CommonGroupTypes.ISCOGroup,
    LocalGroup = CommonGroupTypes.LocalGroup,
    ESCOOccupation = CommonGroupTypes.ESCOOccupation,
    LocalOccupation = CommonGroupTypes.LocalOccupation,
  }

  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {
        INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
        INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
      }
    }
    export namespace Status404 {
      export enum ErrorCodes {
        MODEL_NOT_FOUND = "GET_MODEL_NOT_FOUND",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_CHILDREN = "DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_CHILDREN",
      }
    }
  }
}

export default OccupationGroupChildrenEnums;
