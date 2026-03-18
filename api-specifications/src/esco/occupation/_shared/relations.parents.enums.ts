import { ObjectTypes as CommonObjectTypes } from "../../common/objectTypes";

export enum ObjectTypes {
  ISCOGroup = CommonObjectTypes.ISCOGroup,
  LocalGroup = CommonObjectTypes.LocalGroup,
  ESCOOccupation = CommonObjectTypes.ESCOOccupation,
  LocalOccupation = CommonObjectTypes.LocalOccupation,
}

export namespace Errors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      OCCUPATION_NOT_FOUND = "OCCUPATION_NOT_FOUND",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_RETRIEVE_OCCUPATION_PARENT = "DB_FAILED_TO_RETRIEVE_OCCUPATION_PARENT",
    }
  }
}
