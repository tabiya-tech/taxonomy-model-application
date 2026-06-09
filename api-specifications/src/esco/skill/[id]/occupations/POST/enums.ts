namespace POSTSkillOccupationsErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_SKILL_ID = "INVALID_SKILL_ID",
      INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
      INVALID_RELATION_TYPE = "INVALID_RELATION_TYPE",
      INVALID_SIGNALLING_VALUE_LABEL = "INVALID_SIGNALLING_VALUE_LABEL",
      MUTUALLY_EXCLUSIVE_VALUES = "MUTUALLY_EXCLUSIVE_VALUES",
      MODEL_IS_RELEASED = "MODEL_IS_RELEASED",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
      OCCUPATION_NOT_FOUND = "OCCUPATION_NOT_FOUND",
      MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION = "DB_FAILED_TO_CREATE_OCCUPATION_SKILL_RELATION",
    }
  }
}

export default POSTSkillOccupationsErrors;
