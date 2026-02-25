import { ObjectTypes as CommonObjectTypes } from "../common/objectTypes";
import OccupationEnums from "../occupation/enums";
import * as ParentEnums from "./relations/parents/enums";
import * as ChildrenEnums from "./relations/children/enums";
import * as OccupationsEnums from "./relations/occupations/enums";
import * as RelatedSkillsEnums from "./relations/relatedSkills/enums";

namespace SkillEnums {
  export const ObjectType = CommonObjectTypes.Skill;
  export const OccupationObjectTypes = OccupationEnums.OccupationType;
  export type OccupationObjectTypes = OccupationEnums.OccupationType;

  export enum ObjectTypes {
    Skill = CommonObjectTypes.Skill,
    SkillGroup = CommonObjectTypes.SkillGroup,
  }

  export namespace Relations {
    export namespace Parents {
      export import ObjectTypes = ParentEnums.ObjectTypes;
      export namespace GET {
        export import Response = ParentEnums.GET.Response;
      }
    }

    export namespace Children {
      export import ObjectTypes = ChildrenEnums.ObjectTypes;
      export namespace GET {
        export import Response = ChildrenEnums.GET.Response;
      }
    }

    export namespace Occupations {
      export import ObjectTypes = OccupationsEnums.ObjectTypes;
      export namespace GET {
        export import Response = OccupationsEnums.GET.Response;
      }
    }

    export namespace RelatedSkills {
      export import ObjectTypes = RelatedSkillsEnums.ObjectTypes;
      export import SkillToSkillRelationType = RelatedSkillsEnums.SkillToSkillRelationType;
      export namespace GET {
        export import Response = RelatedSkillsEnums.GET.Response;
      }
    }
  }

  export enum SkillType {
    None = "",
    SkillCompetence = "skill/competence",
    Knowledge = "knowledge",
    Language = "language",
    Attitude = "attitude",
  }

  export enum ReuseLevel {
    None = "",
    SectorSpecific = "sector-specific",
    OccupationSpecific = "occupation-specific",
    CrossSector = "cross-sector",
    Transversal = "transversal",
  }

  export enum SkillToSkillRelationType {
    ESSENTIAL = "essential",
    OPTIONAL = "optional",
  }

  export enum SignallingValueLabel {
    NONE = "",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
  }

  export enum OccupationToSkillRelationType {
    NONE = "",
    ESSENTIAL = "essential",
    OPTIONAL = "optional",
  }

  export namespace GET {
    export namespace Response {
      export namespace Status400 {
        export enum ErrorCodes {
          INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
          INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
          INVALID_SKILL_ID = "INVALID_SKILL_ID",
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
  }

  export namespace POST {
    export namespace Response {
      export namespace Status400 {
        export enum ErrorCodes {
          SKILL_COULD_NOT_VALIDATE = "SKILL_COULD_NOT_VALIDATE",
          UNABLE_TO_ALTER_RELEASED_MODEL = "UNABLE_TO_ALTER_RELEASED_MODEL",
        }
      }
      export namespace Status404 {
        export enum ErrorCodes {
          MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
        }
      }
      export namespace Status500 {
        export enum ErrorCodes {
          DB_FAILED_TO_CREATE_SKILL = "DB_FAILED_TO_CREATE_SKILL",
        }
      }
    }
  }
}

export default SkillEnums;
