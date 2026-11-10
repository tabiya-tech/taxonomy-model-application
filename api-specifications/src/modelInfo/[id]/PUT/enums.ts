namespace PUTModelEnums {
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {
        UUID_HISTORY_MISSING_CURRENT_UUID = "UUID_HISTORY_MISSING_CURRENT_UUID",
        AVAILABLE_LANGUAGES_REMOVAL_NOT_SUPPORTED = "AVAILABLE_LANGUAGES_REMOVAL_NOT_SUPPORTED",
      }
    }
    export namespace Status404 {
      export enum ErrorCodes {
        MODEL_NOT_FOUND_BY_ID = "MODEL_NOT_FOUND_BY_ID",
      }
    }
    export namespace Status409 {
      export enum ErrorCodes {
        MODEL_IS_RELEASED = "MODEL_IS_RELEASED",
        MODEL_CHANGED_CONCURRENTLY = "MODEL_CHANGED_CONCURRENTLY",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_UPDATE_MODEL = "DB_FAILED_TO_UPDATE_MODEL",
      }
    }
  }
}

export default PUTModelEnums;
