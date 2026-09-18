namespace PATCHModelEnums {
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {
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
        MODEL_ALREADY_RELEASED = "MODEL_ALREADY_RELEASED",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RELEASE_MODEL = "DB_FAILED_TO_RELEASE_MODEL",
        DB_FAILED_TO_UPDATE_AVAILABLE_LANGUAGES = "DB_FAILED_TO_UPDATE_AVAILABLE_LANGUAGES",
      }
    }
  }
}

export default PATCHModelEnums;
