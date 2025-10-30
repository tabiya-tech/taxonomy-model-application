import { ObjectTypes as CommonGroupTypes } from "../common/objectTypes";

namespace SkillGroupEnums {
  export enum ObjectTypes {
    Skill = CommonGroupTypes.Skill,
    SkillGroup = CommonGroupTypes.SkillGroup,
  }

  export namespace GET {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_SKILL_GROUPS = "DB_FAILED_TO_RETRIEVE_SKILL_GROUPS",
        INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
        INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_CREATE_SKILL_GROUP = "DB_FAILED_TO_CREATE_SKILL_GROUP",
        SKILL_GROUP_COULD_NOT_VALIDATE = "SKILL_GROUP_COULD_NOT_VALIDATE",
      }
    }
  }
}

export default SkillGroupEnums;
