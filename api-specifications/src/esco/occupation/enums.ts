import { ObjectTypes as CommonObjectTypes } from "../common/objectTypes";

namespace OccupationEnums {
  export enum ObjectTypes {
    ISCOGroup = CommonObjectTypes.ISCOGroup,
    LocalGroup = CommonObjectTypes.LocalGroup,
    ESCOOccupation = CommonObjectTypes.ESCOOccupation,
    LocalOccupation = CommonObjectTypes.LocalOccupation,
    Skill = CommonObjectTypes.Skill,
    SkillGroup = CommonObjectTypes.SkillGroup,
  }

  // Lift OccupationType enum one level up
  export enum OccupationType {
    ESCOOccupation = ObjectTypes.ESCOOccupation,
    LocalOccupation = ObjectTypes.LocalOccupation,
  }

  export namespace GET {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATIONS = "DB_FAILED_TO_RETRIEVE_OCCUPATIONS",
        INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
        INVALID_LIMIT = "INVALID_LIMIT",
        INVALID_NEXT_CURSOR = "INVALID_NEXT_CURSOR",
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_CREATE_OCCUPATION = "DB_FAILED_TO_CREATE_OCCUPATION",
        OCCUPATION_COULD_NOT_VALIDATE = "OCCUPATION_COULD_NOT_VALIDATE",
        INVALID_MODEL_ID = "INVALID_MODEL_ID",
      }
    }
  }
}

export default OccupationEnums;
