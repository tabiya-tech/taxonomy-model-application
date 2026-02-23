import { ObjectTypes as CommonObjectTypes } from "../../../common/objectTypes";

export enum ObjectTypes {
  SkillGroup = CommonObjectTypes.SkillGroup,
  Skill = CommonObjectTypes.Skill,
}

export namespace GET {
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {
        INVALID_SKILL_ID = "INVALID_SKILL_ID",
        INVALID_MODEL_ID = "INVALID_MODEL_ID",
      }
    }
    export namespace Status404 {
      export enum ErrorCodes {
        SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
        MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_SKILL_PARENTS = "DB_FAILED_TO_RETRIEVE_SKILL_PARENTS",
      }
    }
  }
}
