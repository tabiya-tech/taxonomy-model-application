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
        INVALID_LIMIT = "INVALID_LIMIT",
        INVALID_NEXT_CURSOR = "INVALID_NEXT_CURSOR",
      }
    }
  }

  export namespace POST {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_CREATE_SKILL = "DB_FAILED_TO_CREATE_SKILL",
        SKILL_COULD_NOT_VALIDATE = "SKILL_COULD_NOT_VALIDATE",
        INVALID_MODEL_ID = "INVALID_MODEL_ID",
        CANNOT_CREATE_SKILL_ON_RELEASED_MODEL = "CANNOT_CREATE_SKILL_ON_RELEASED_MODEL",
      }
    }
  }
}

export default SkillEnums;
