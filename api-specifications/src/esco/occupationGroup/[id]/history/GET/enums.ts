namespace GETOccupationGroupHistoryEnums {
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
        DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_HISTORY = "DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_HISTORY",
      }
    }
  }
}

export default GETOccupationGroupHistoryEnums;
