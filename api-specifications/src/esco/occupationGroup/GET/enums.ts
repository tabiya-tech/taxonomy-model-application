namespace GETOccupationGroupEnums {
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {
        INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
        INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
      }
    }
    export namespace Status404 {
      export enum ErrorCodes {
        OCCUPATION_GROUP_NOT_FOUND = "OCCUPATION_GROUP_NOT_FOUND",
        MODEL_NOT_FOUND = "GET_MODEL_NOT_FOUND",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS = "DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS",
      }
    }
  }
}

export default GETOccupationGroupEnums;
