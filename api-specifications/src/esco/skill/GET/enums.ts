import * as ParentEnums from "../[id]/parents/GET/enums";
import * as ChildrenEnums from "../[id]/children/GET/enums";
import * as OccupationsEnums from "../[id]/occupations/GET/enums";
import * as RelatedSkillsEnums from "../[id]/relatedSkills/GET/enums";

namespace GETSkillsErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
      INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
      INVALID_SKILL_ID = "INVALID_SKILL_ID",
      INVALID_MODEL_ID = "INVALID_MODEL_ID",
    }
    export namespace Parents {
      export import ErrorCodes = ParentEnums.GET.Response.Status400.ErrorCodes;
    }
    export namespace Children {
      export import ErrorCodes = ChildrenEnums.GET.Response.Status400.ErrorCodes;
    }
    export namespace Occupations {
      export import ErrorCodes = OccupationsEnums.GET.Response.Status400.ErrorCodes;
    }
    export namespace RelatedSkills {
      export import ErrorCodes = RelatedSkillsEnums.GET.Response.Status400.ErrorCodes;
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
      MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    }
    export namespace Parents {
      export import ErrorCodes = ParentEnums.GET.Response.Status404.ErrorCodes;
    }
    export namespace Children {
      export import ErrorCodes = ChildrenEnums.GET.Response.Status404.ErrorCodes;
    }
    export namespace Occupations {
      export import ErrorCodes = OccupationsEnums.GET.Response.Status404.ErrorCodes;
    }
    export namespace RelatedSkills {
      export import ErrorCodes = RelatedSkillsEnums.GET.Response.Status404.ErrorCodes;
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_RETRIEVE_SKILLS = "DB_FAILED_TO_RETRIEVE_SKILLS",
      DB_FAILED_TO_RETRIEVE_SKILL = "DB_FAILED_TO_RETRIEVE_SKILL",
    }
    export namespace Parents {
      export import ErrorCodes = ParentEnums.GET.Response.Status500.ErrorCodes;
    }
    export namespace Children {
      export import ErrorCodes = ChildrenEnums.GET.Response.Status500.ErrorCodes;
    }
    export namespace Occupations {
      export import ErrorCodes = OccupationsEnums.GET.Response.Status500.ErrorCodes;
    }
    export namespace RelatedSkills {
      export import ErrorCodes = RelatedSkillsEnums.GET.Response.Status500.ErrorCodes;
    }
  }
}

export default GETSkillsErrors;
