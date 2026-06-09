namespace POSTSkillParentsErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_SKILL_ID = "INVALID_SKILL_ID",
      INVALID_PARENT_ID = "INVALID_PARENT_ID",
      INVALID_PARENT_TYPE = "INVALID_PARENT_TYPE",
      MODEL_IS_RELEASED = "MODEL_IS_RELEASED",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
      PARENT_NOT_FOUND = "PARENT_NOT_FOUND",
      MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_CREATE_SKILL_PARENT_RELATION = "DB_FAILED_TO_CREATE_SKILL_PARENT_RELATION",
    }
  }
}

export default POSTSkillParentsErrors;
