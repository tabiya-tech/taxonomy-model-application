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
      export namespace Status400 {
        export enum ErrorCodes {
          INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER_FOR_OCCUPATION",
          INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER_FOR_OCCUPATION",
          INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
          INVALID_MODEL_ID = "INVALID_MODEL_ID_FOR_OCCUPATION",
        }
      }
      export namespace Status404 {
        export enum ErrorCodes {
          OCCUPATION_NOT_FOUND = "OCCUPATION_NOT_FOUND_FOR_OCCUPATION",
          MODEL_NOT_FOUND = "GET_MODEL_NOT_FOUND_FOR_OCCUPATION",
        }
      }
      export namespace Status500 {
        export enum ErrorCodes {
          DB_FAILED_TO_RETRIEVE_OCCUPATIONS = "DB_FAILED_TO_RETRIEVE_OCCUPATIONS_FOR_OCCUPATION",
        }
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export namespace Status400 {
        export enum ErrorCodes {
          OCCUPATION_COULD_NOT_VALIDATE = "OCCUPATION_COULD_NOT_VALIDATE",
          UNABLE_TO_ALTER_RELEASED_MODEL = "UNABLE_TO_ALTER_RELEASED_MODEL_FOR_OCCUPATION",
          INVALID_MODEL_ID = "INVALID_MODEL_ID_FOR_OCCUPATION_POST",
        }
      }
      export namespace Status404 {
        export enum ErrorCodes {
          MODEL_NOT_FOUND = "POST_MODEL_NOT_FOUND_FOR_OCCUPATION",
        }
      }
      export namespace Status500 {
        export enum ErrorCodes {
          DB_FAILED_TO_CREATE_OCCUPATION = "DB_FAILED_TO_CREATE_OCCUPATION",
        }
      }
    }
  }
}

export default OccupationEnums;
