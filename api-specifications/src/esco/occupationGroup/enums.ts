import { ObjectTypes as CommonGroupTypes } from "../common/objectTypes";

namespace OccupationGroupEnums {
  export enum ObjectTypes {
    ISCOGroup = CommonGroupTypes.ISCOGroup,
    LocalGroup = CommonGroupTypes.LocalGroup,
  }

  export namespace Relations {
    export namespace Parent {
      export enum ObjectTypes {
        ISCOGroup = CommonGroupTypes.ISCOGroup,
        LocalGroup = CommonGroupTypes.LocalGroup,
      }
    }
    export namespace Children {
      export enum ObjectTypes {
        ISCOGroup = CommonGroupTypes.ISCOGroup,
        LocalGroup = CommonGroupTypes.LocalGroup,
        ESCOOccupation = CommonGroupTypes.ESCOOccupation,
        LocalOccupation = CommonGroupTypes.LocalOccupation,
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
          OCCUPATION_GROUP_NOT_FOUND = "OCCUPATION_GROUP_NOT_FOUND",
          OCCUPATION_GROUP_PARENT_NOT_FOUND = "OCCUPATION_GROUP_PARENT_NOT_FOUND",
          MODEL_NOT_FOUND = "GET_MODEL_NOT_FOUND",
        }
      }
      export namespace Status500 {
        export enum ErrorCodes {
          DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS = "DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS",
        }
      }
    }
  }
  export namespace POST {
    export namespace Response {
      export namespace Status400 {
        export enum ErrorCodes {
          OCCUPATION_GROUP_COULD_NOT_VALIDATE = "OCCUPATION_GROUP_COULD_NOT_VALIDATE",
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
          DB_FAILED_TO_CREATE_OCCUPATION_GROUP = "DB_FAILED_TO_CREATE_OCCUPATION_GROUP",
        }
      }
    }
  }
}

export default OccupationGroupEnums;
