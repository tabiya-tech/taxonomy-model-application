import { ObjectTypes as CommonGroupTypes } from "../../../../common/objectTypes";

namespace DELETEOccupationGroupParentErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_OCCUPATION_GROUP_ID = "INVALID_OCCUPATION_GROUP_ID",
      MODEL_IS_RELEASED = "MODEL_IS_RELEASED",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      OCCUPATION_GROUP_NOT_FOUND = "OCCUPATION_GROUP_NOT_FOUND",
      PARENT_NOT_FOUND = "PARENT_NOT_FOUND",
      MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_DELETE_OCCUPATION_GROUP_PARENT = "DB_FAILED_TO_DELETE_OCCUPATION_GROUP_PARENT",
    }
  }
  export enum ObjectTypes {
    ISCOGroup = CommonGroupTypes.ISCOGroup,
    LocalGroup = CommonGroupTypes.LocalGroup,
  }
}

export default DELETEOccupationGroupParentErrors;
