import { ObjectTypes as CommonGroupTypes } from "../../../common/objectTypes";
import OccupationGroupEnums from "../../enums";

namespace OccupationGroupParentEnums {
  export enum ObjectTypes {
    ISCOGroup = CommonGroupTypes.ISCOGroup,
    LocalGroup = CommonGroupTypes.LocalGroup,
  }
  export import Relations = OccupationGroupEnums.Relations;
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
          OCCUPATION_GROUP_PARENT_NOT_FOUND = "OCCUPATION_GROUP_PARENT_NOT_FOUND",
        }
      }
      export namespace Status500 {
        export enum ErrorCodes {
          DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_PARENT = "DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUP_PARENT",
        }
      }
    }
  }
}

export default OccupationGroupParentEnums;
