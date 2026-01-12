import { ObjectTypes as CommonObjectTypes } from "../../../common/objectTypes";

export enum ObjectTypes {
  Skill = CommonObjectTypes.Skill,
}

export enum OccupationToSkillRelationType {
  NONE = "",
  ESSENTIAL = "essential",
  OPTIONAL = "optional",
}

export namespace GET {
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {}
    }
    export namespace Status404 {
      export enum ErrorCodes {
        SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATION_SKILLS = "DB_FAILED_TO_RETRIEVE_OCCUPATION_SKILLS",
      }
    }
  }
}
