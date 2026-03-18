import { ObjectTypes as CommonObjectTypes } from "../../common/objectTypes";
import { ObjectTypes as ParentObjectTypes, Errors as ParentErrors } from "./relations.parents.enums";
import { ObjectTypes as ChildrenObjectTypes, Errors as ChildrenErrors } from "./relations.children.enums";
import {
  ObjectTypes as RequiredSkillsObjectTypes,
  OccupationToSkillRelationType as OccupationToSkillRelationTypeEnum,
  Errors as SkillsErrors,
} from "./relations.skills.enums";

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

  export namespace POSTErrors {
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

  export namespace GETErrors {
    export namespace Status400 {
      export enum ErrorCodes {
        INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
        INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
        INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
        INVALID_MODEL_ID = "INVALID_MODEL_ID",
      }
    }
    export namespace Status404 {
      export enum ErrorCodes {
        OCCUPATION_NOT_FOUND = "OCCUPATION_NOT_FOUND",
        MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATIONS = "DB_FAILED_TO_RETRIEVE_OCCUPATIONS",
      }
    }
  }

  export import GETParentErrors = ParentErrors;

  export import GETChildrenErrors = ChildrenErrors;

  export import GETSkillsErrors = SkillsErrors;
}

export default OccupationEnums;
