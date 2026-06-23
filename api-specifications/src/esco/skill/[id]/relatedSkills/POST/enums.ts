namespace POSTSkillRelatedErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_SKILL_ID = "INVALID_SKILL_ID",
      INVALID_REQUIRED_SKILL_ID = "INVALID_REQUIRED_SKILL_ID",
      INVALID_RELATION_TYPE = "INVALID_RELATION_TYPE",
      MODEL_IS_RELEASED = "MODEL_IS_RELEASED",
      RELATION_CODE_INCONSISTENT = "RELATION_CODE_INCONSISTENT",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
      REQUIRED_SKILL_NOT_FOUND = "REQUIRED_SKILL_NOT_FOUND",
      MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_CREATE_SKILL_RELATION = "DB_FAILED_TO_CREATE_SKILL_RELATION",
    }
  }
}

export default POSTSkillRelatedErrors;
