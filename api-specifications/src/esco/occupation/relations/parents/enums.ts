import { ObjectTypes as CommonObjectTypes } from "../../../common/objectTypes";

export enum ObjectTypes {
  ISCOGroup = CommonObjectTypes.ISCOGroup,
  LocalGroup = CommonObjectTypes.LocalGroup,
  ESCOOccupation = CommonObjectTypes.ESCOOccupation,
  LocalOccupation = CommonObjectTypes.LocalOccupation,
}

export namespace GET {
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {}
    }
    export namespace Status404 {
      export enum ErrorCodes {}
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATION_PARENT = "DB_FAILED_TO_RETRIEVE_OCCUPATION_PARENT",
      }
    }
  }
}
