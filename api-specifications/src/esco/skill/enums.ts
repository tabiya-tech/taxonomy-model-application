import { ObjectTypes as CommonObjectTypes } from "../common/objectTypes";
import OccupationEnums from "../occupation/enums";

namespace SkillEnums {
  export const ObjectType = CommonObjectTypes.Skill;
  export const OccupationObjectTypes = OccupationEnums.OccupationType;

  export enum ObjectTypes {
    Skill = CommonObjectTypes.Skill,
    SkillGroup = CommonObjectTypes.SkillGroup,
  }

  export namespace Relations {
    export namespace Parents {
      export enum ObjectTypes {
        SkillGroup = CommonObjectTypes.SkillGroup,
        Skill = CommonObjectTypes.Skill,
      }
    }

    export namespace Children {
      export enum ObjectTypes {
        Skill = CommonObjectTypes.Skill,
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
    export namespace List {
      export namespace Response {
        export namespace Status400 {
          export enum ErrorCodes {
            INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
            INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
          }
        }
        export namespace Status404 {
          export enum ErrorCodes {
            MODEL_NOT_FOUND = "MODEL_NOT_FOUND_FOR_SKILL_LIST",
          }
        }
        export namespace Status500 {
          export enum ErrorCodes {
            DB_FAILED_TO_RETRIEVE_SKILLS = "DB_FAILED_TO_RETRIEVE_SKILLS",
          }
        }
      }
    }

    export namespace ById {
      export namespace Response {
        export namespace Status400 {
          export enum ErrorCodes {
            INVALID_SKILL_ID = "INVALID_SKILL_ID",
          }
        }
        export namespace Status404 {
          export enum ErrorCodes {
            SKILL_NOT_FOUND = "SKILL_NOT_FOUND",
            MODEL_NOT_FOUND = "MODEL_NOT_FOUND_FOR_SKILL_GET",
          }
        }
        export namespace Status500 {
          export enum ErrorCodes {
            DB_FAILED_TO_RETRIEVE_SKILL = "DB_FAILED_TO_RETRIEVE_SKILL",
          }
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
