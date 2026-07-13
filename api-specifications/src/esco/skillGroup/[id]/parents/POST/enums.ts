import { ObjectTypes as CommonGroupTypes } from "../../../../common/objectTypes";

namespace POSTSkillGroupParentErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_SKILL_GROUP_ID = "INVALID_SKILL_GROUP_ID",
      INVALID_PARENT_ID = "INVALID_PARENT_ID",
      INVALID_PARENT_TYPE = "INVALID_PARENT_TYPE",
      PARENT_CHILD_CODE_INCONSISTENT = "PARENT_CHILD_CODE_INCONSISTENT",
      MODEL_IS_RELEASED = "MODEL_IS_RELEASED",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      SKILL_GROUP_NOT_FOUND = "SKILL_GROUP_NOT_FOUND",
      PARENT_NOT_FOUND = "PARENT_NOT_FOUND",
      MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT = "DB_FAILED_TO_CREATE_SKILL_GROUP_PARENT",
    }
  }
  export enum ObjectTypes {
    SkillGroup = CommonGroupTypes.SkillGroup,
  }
}

export default POSTSkillGroupParentErrors;
