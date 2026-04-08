import { ObjectTypes as CommonObjectTypes } from "../../common/objectTypes";
import OccupationEnums from "../../occupation/_shared/enums";
import * as ParentEnums from "../[id]/parents/GET/enums";
import * as ChildrenEnums from "../[id]/children/GET/enums";
import * as OccupationsEnums from "../[id]/occupations/GET/enums";
import * as RelatedSkillsEnums from "../[id]/relatedSkills/GET/enums";

namespace SkillEnums {
  export const ObjectType = CommonObjectTypes.Skill;
  export type OccupationObjectTypes = OccupationEnums.OccupationType;
  export const OccupationObjectTypes = OccupationEnums.OccupationType;

  export enum ObjectTypes {
    Skill = CommonObjectTypes.Skill,
    SkillGroup = CommonObjectTypes.SkillGroup,
  }

  export namespace Relations {
    export namespace Parents {
      export import ObjectTypes = ParentEnums.ObjectTypes;
    }

    export namespace Children {
      export import ObjectTypes = ChildrenEnums.ObjectTypes;
    }

    export namespace Occupations {
      export import ObjectTypes = OccupationsEnums.ObjectTypes;
    }

    export namespace RelatedSkills {
      export import ObjectTypes = RelatedSkillsEnums.ObjectTypes;
      export import SkillToSkillRelationType = RelatedSkillsEnums.SkillToSkillRelationType;
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
}

export default SkillEnums;
