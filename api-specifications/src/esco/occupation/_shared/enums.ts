import { ObjectTypes as CommonObjectTypes } from "../../common/objectTypes";

namespace OccupationEnums {
  export enum OccupationType {
    ESCOOccupation = CommonObjectTypes.ESCOOccupation,
    LocalOccupation = CommonObjectTypes.LocalOccupation,
  }

  /**
   * Relation types between occupations and skills.
   * Shared by POST (payload validation) and skills/GET (response schema).
   */
  export enum OccupationToSkillRelationType {
    NONE = "",
    ESSENTIAL = "essential",
    OPTIONAL = "optional",
  }

  export namespace Relations {
    export namespace Parent {
      export enum ObjectTypes {
        ISCOGroup = CommonObjectTypes.ISCOGroup,
        LocalGroup = CommonObjectTypes.LocalGroup,
        ESCOOccupation = CommonObjectTypes.ESCOOccupation,
        LocalOccupation = CommonObjectTypes.LocalOccupation,
      }
    }
    export namespace Children {
      export enum ObjectTypes {
        ISCOGroup = CommonObjectTypes.ISCOGroup,
        LocalGroup = CommonObjectTypes.LocalGroup,
        ESCOOccupation = CommonObjectTypes.ESCOOccupation,
        LocalOccupation = CommonObjectTypes.LocalOccupation,
      }
    }
    export namespace RequiredSkills {
      export enum ObjectTypes {
        Skill = CommonObjectTypes.Skill,
      }
    }
  }
}

export default OccupationEnums;
