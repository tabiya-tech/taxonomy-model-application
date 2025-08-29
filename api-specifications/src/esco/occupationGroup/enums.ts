import { ObjectTypes } from "../common/objectTypes";

namespace OccupationGroupEnums {
  export namespace ENUMS {
    export enum GroupType {
      ISCOGroup = ObjectTypes.ISCOGroup,
      LocalGroup = ObjectTypes.LocalGroup,
    }
  }
  export namespace GET {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS = "DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS",
      }
    }
  }
  export namespace POST {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_CREATE_OCCUPATION_GROUP = "DB_FAILED_TO_CREATE_OCCUPATION_GROUP",
        OCCUPATION_GROUP_COULD_NOT_VALIDATE = "OCCUPATION_GROUP_COULD_NOT_VALIDATE",
      }
    }
  }
}

export default OccupationGroupEnums;
