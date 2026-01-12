import { ObjectTypes as CommonObjectTypes } from "../common/objectTypes";
import { ObjectTypes as ParentObjectTypes, GET as ParentGET } from "./relations/parents/enums";
import { ObjectTypes as ChildrenObjectTypes, GET as ChildrenGET } from "./relations/children/enums";
import {
  ObjectTypes as RequiredSkillsObjectTypes,
  OccupationToSkillRelationType as OccupationToSkillRelationTypeEnum,
  GET as SkillsGET,
} from "./relations/skills/enums";

namespace OccupationEnums {
  export enum OccupationType {
    ESCOOccupation = CommonObjectTypes.ESCOOccupation,
    LocalOccupation = CommonObjectTypes.LocalOccupation,
  }

  export import OccupationToSkillRelationType = OccupationToSkillRelationTypeEnum;

  export namespace Relations {
    export namespace Parent {
      export import ObjectTypes = ParentObjectTypes;
    }

    export namespace Children {
      export import ObjectTypes = ChildrenObjectTypes;
    }

    export namespace RequiredSkills {
      export import ObjectTypes = RequiredSkillsObjectTypes;
    }
  }

  export namespace GET {
    export namespace Response {
      export namespace Status400 {
        export enum ErrorCodes {
          INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
          INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
          INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
          INVALID_MODEL_ID = "INVALID_MODEL_ID",
        }
        export namespace Parent {
          export import ErrorCodes = ParentGET.Response.Status400.ErrorCodes;
        }
        export namespace Children {
          export import ErrorCodes = ChildrenGET.Response.Status400.ErrorCodes;
        }
        export namespace Skills {
          export import ErrorCodes = SkillsGET.Response.Status400.ErrorCodes;
        }
      }
      export namespace Status404 {
        export enum ErrorCodes {
          OCCUPATION_NOT_FOUND = "OCCUPATION_NOT_FOUND",
          MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
        }
        export namespace Parent {
          export import ErrorCodes = ParentGET.Response.Status404.ErrorCodes;
        }
        export namespace Children {
          export import ErrorCodes = ChildrenGET.Response.Status404.ErrorCodes;
        }
        export namespace Skills {
          export import ErrorCodes = SkillsGET.Response.Status404.ErrorCodes;
        }
      }
      export namespace Status500 {
        export enum ErrorCodes {
          DB_FAILED_TO_RETRIEVE_OCCUPATIONS = "DB_FAILED_TO_RETRIEVE_OCCUPATIONS",
        }
        export namespace Parent {
          export import ErrorCodes = ParentGET.Response.Status500.ErrorCodes;
        }
        export namespace Children {
          export import ErrorCodes = ChildrenGET.Response.Status500.ErrorCodes;
        }
        export namespace Skills {
          export import ErrorCodes = SkillsGET.Response.Status500.ErrorCodes;
        }
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export namespace Status400 {
        export enum ErrorCodes {
          OCCUPATION_COULD_NOT_VALIDATE = "OCCUPATION_COULD_NOT_VALIDATE",
          UNABLE_TO_ALTER_RELEASED_MODEL = "UNABLE_TO_ALTER_RELEASED_MODEL",
          INVALID_MODEL_ID = "INVALID_MODEL_ID",
        }
      }
      export namespace Status404 {
        export enum ErrorCodes {
          MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
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
