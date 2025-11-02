import { ObjectTypes as CommonObjectTypes } from "../common/objectTypes";

namespace SkillEnums {
  export const ObjectType = CommonObjectTypes.Skill;

  export enum ObjectTypes {
    Skill = CommonObjectTypes.Skill,
    SkillGroup = CommonObjectTypes.SkillGroup,
  }

  export namespace Relations {
    export namespace Parents {
      export enum ObjectTypes {
        SkillGroup = CommonObjectTypes.SkillGroup,
      }
    }

    export namespace Children {
      export enum ObjectTypes {
        Skill = CommonObjectTypes.Skill,
        SkillGroup = CommonObjectTypes.SkillGroup,
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
    NONE = "",
    BROADER = "broader",
    NARROWER = "narrower",
    RELATED = "related",
  }

  export namespace GET {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_SKILLS = "DB_FAILED_TO_RETRIEVE_SKILLS",
        INVALID_SKILL_ID = "INVALID_SKILL_ID",
        INVALID_LIMIT_FOR_SKILLS = "INVALID_LIMIT_FOR_SKILLS",
        INVALID_NEXT_CURSOR_FOR_SKILLS = "INVALID_NEXT_CURSOR_FOR_SKILLS",
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_CREATE_SKILL = "DB_FAILED_TO_CREATE_SKILL",
        DB_FAILED_TO_RETRIEVE_A_SINGLE_SKILL = "DB_FAILED_TO_RETRIEVE_A_SINGLE_SKILL",
        DB_FAILED_TO_CREATE_SKILL_ON_ALREADY_RELEASED_MODEL = "DB_FAILED_TO_CREATE_SKILL_ON_ALREADY_RELEASED_MODEL",
        SKILL_COULD_NOT_VALIDATE = "SKILL_COULD_NOT_VALIDATE",
      }
    }
  }
}

export default SkillEnums;
