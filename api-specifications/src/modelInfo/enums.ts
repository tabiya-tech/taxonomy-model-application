namespace ModelInfoEnums {
  export enum Language {
    EN = "en",
    FR = "fr",
  }

  export namespace GET {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_MODELS = "DB_FAILED_TO_RETRIEVE_MODELS",
      }
    }
  }
  export namespace POST {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_CREATE_MODEL = "DB_FAILED_TO_CREATE_MODEL",
        MODEL_COULD_NOT_VALIDATE = "MODEL_COULD_NOT_VALIDATE",
      }
    }
  }
}

export default ModelInfoEnums;
