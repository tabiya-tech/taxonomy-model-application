namespace DELETEOccupationGroupErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      UNABLE_TO_ALTER_RELEASED_MODEL = "UNABLE_TO_ALTER_RELEASED_MODEL",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
      OCCUPATION_GROUP_NOT_FOUND = "OCCUPATION_GROUP_NOT_FOUND",
    }
  }
  export namespace Status409 {
    export enum ErrorCodes {
      CANNOT_DELETE_ENTITY_WITH_CHILDREN = "CANNOT_DELETE_ENTITY_WITH_CHILDREN",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_DELETE_OCCUPATION_GROUP = "DB_FAILED_TO_DELETE_OCCUPATION_GROUP",
    }
  }
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {
        UNABLE_TO_ALTER_RELEASED_MODEL = "UNABLE_TO_ALTER_RELEASED_MODEL",
      }
    }
    export namespace Status404 {
      export enum ErrorCodes {
        MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
        OCCUPATION_GROUP_NOT_FOUND = "OCCUPATION_GROUP_NOT_FOUND",
      }
    }
    export namespace Status409 {
      export enum ErrorCodes {
        CANNOT_DELETE_ENTITY_WITH_CHILDREN = "CANNOT_DELETE_ENTITY_WITH_CHILDREN",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_DELETE_OCCUPATION_GROUP = "DB_FAILED_TO_DELETE_OCCUPATION_GROUP",
      }
    }
  }
}

export default DELETEOccupationGroupErrors;
