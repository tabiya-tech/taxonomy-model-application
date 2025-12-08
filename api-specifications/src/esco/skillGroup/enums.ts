import { ObjectTypes as CommonGroupTypes } from "../common/objectTypes";

namespace SkillGroupEnums {
  export namespace Relations {
    export namespace Parents {
      export enum ObjectTypes {
        SkillGroup = CommonGroupTypes.SkillGroup,
      }
    }

    export namespace Children {
      export enum ObjectTypes {
        Skill = CommonGroupTypes.Skill,
        SkillGroup = CommonGroupTypes.SkillGroup,
      }
    }
  }

  export namespace GET {
    export namespace Response {
      export namespace Status400 {
        export enum ErrorCodes {
          INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
          INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
        }
      }
      export namespace Status404 {
        export enum ErrorCodes {
          SKILL_GROUP_NOT_FOUND = "SKILL_GROUP_NOT_FOUND",
          MODEL_NOT_FOUND = "GET_MODEL_NOT_FOUND",
        }
      }
      export namespace Status500 {
        export enum ErrorCodes {
          DB_FAILED_TO_RETRIEVE_SKILL_GROUPS = "DB_FAILED_TO_RETRIEVE_SKILL_GROUPS",
        }
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export namespace Status400 {
        export enum ErrorCodes {
          SKILL_GROUP_COULD_NOT_VALIDATE = "SKILL_GROUP_COULD_NOT_VALIDATE",
          UNABLE_TO_ALTER_RELEASED_MODEL = "UNABLE_TO_ALTER_RELEASED_MODEL",
        }
      }
      export namespace Status404 {
        export enum ErrorCodes {
          MODEL_NOT_FOUND = "POST_MODEL_NOT_FOUND",
        }
      }
      export namespace Status500 {
        export enum ErrorCodes {
          DB_FAILED_TO_CREATE_SKILL_GROUP = "DB_FAILED_TO_CREATE_SKILL_GROUP",
          DB_FAILED_TO_RETRIEVE_A_SINGLE_SKILL_GROUP = "DB_FAILED_TO_RETRIEVE_A_SINGLE_SKILL_GROUP",
          DB_FAILED_TO_CREATE_SKILL_GROUP_ON_ALREADY_RELEASED_MODEL = "DB_FAILED_TO_CREATE_SKILL_GROUP_ON_ALREADY_RELEASED_MODEL",
        }
      }
    }
  }
}

export default SkillGroupEnums;
