namespace PATCHSkillGroupErrors {
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {
        SKILL_GROUP_COULD_NOT_VALIDATE = "SKILL_GROUP_COULD_NOT_VALIDATE",
        UNABLE_TO_ALTER_RELEASED_MODEL = "UNABLE_TO_ALTER_RELEASED_MODEL",
        INVALID_MODEL_ID = "INVALID_MODEL_ID",
      }
    }
    export namespace Status404 {
      export enum ErrorCodes {
        MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
        SKILL_GROUP_NOT_FOUND = "SKILL_GROUP_NOT_FOUND",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_UPDATE_SKILL_GROUP = "DB_FAILED_TO_UPDATE_SKILL_GROUP",
      }
    }
  }
}

export default PATCHSkillGroupErrors;
