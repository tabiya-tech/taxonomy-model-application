import { ObjectTypes as CommonObjectTypes } from "../common/objectTypes";

namespace OccupationEnums {
  export enum OccupationType {
    ESCOOccupation = CommonObjectTypes.ESCOOccupation,
    LocalOccupation = CommonObjectTypes.LocalOccupation,
  }

  export enum OccupationToSkillRelationType {
    NONE = "",
    ESSENTIAL = "essential",
    OPTIONAL = "optional",
  }

  export namespace Relations {
    export namespace Parent {
      export enum ObjectTypes {
        ISCOGroup = CommonObjectTypes.ISCOGroup,
        LocalGroup = CommonObjectTypes.LocalGroup,
        ESCOOccupation = CommonObjectTypes.ESCOOccupation,
        LocalOccupation = CommonObjectTypes.LocalOccupation,
      }
    }

    export namespace Children {
      export enum ObjectTypes {
        ESCOOccupation = CommonObjectTypes.ESCOOccupation,
        LocalOccupation = CommonObjectTypes.LocalOccupation,
      }
    }

    export namespace RequiredSkills {
      export enum ObjectTypes {
        Skill = CommonObjectTypes.Skill,
      }
    }
  }

  export namespace GET {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATIONS = "DB_FAILED_TO_RETRIEVE_OCCUPATIONS",
        INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
        INVALID_LIMIT = "INVALID_LIMIT",
        INVALID_NEXT_CURSOR = "INVALID_NEXT_CURSOR",
        MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
        INVALID_MODEL_ID = "INVALID_MODEL",
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_CREATE_OCCUPATION = "DB_FAILED_TO_CREATE_OCCUPATION",
        OCCUPATION_COULD_NOT_VALIDATE = "OCCUPATION_COULD_NOT_VALIDATE",
        INVALID_MODEL_ID = "INVALID_MODEL_ID",
        MODEL_ALREADY_RELEASED = "CANNOT_CREATE_OCCUPATION_GROUP_ON_RELEASED_MODEL",
      }
    }
  }
}

export default OccupationEnums;
