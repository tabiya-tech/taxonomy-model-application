import { ObjectTypes as CommonObjectTypes } from "../../../common/objectTypes";

export enum ObjectTypes {
  SkillGroup = CommonObjectTypes.SkillGroup,
  Skill = CommonObjectTypes.Skill,
}

export namespace GET {
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {}
    }
    export namespace Status404 {
      export enum ErrorCodes {}
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_SKILL_PARENTS = "DB_FAILED_TO_RETRIEVE_SKILL_PARENTS",
      }
    }
  }
}
