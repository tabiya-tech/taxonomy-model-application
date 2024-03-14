namespace UUIDHistoryEnums {
  export namespace GET {
    export namespace Request {
      export enum ErrorCodes {
        MODEL_COULD_NOT_VALIDATE = "MODEL_COULD_NOT_VALIDATE",
      }
    }
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_UUID_HISTORY = "DB_FAILED_TO_RETRIEVE_UUID_HISTORY",
      }
    }
  }
}

export default UUIDHistoryEnums;
