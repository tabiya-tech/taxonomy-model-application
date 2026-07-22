import { ObjectTypes as CommonGroupTypes } from "../../common/objectTypes";

namespace SkillGroupEnums {
  export enum SearchableField {
    preferredLabel = "preferredLabel",
    description = "description",
    altLabels = "altLabels",
    scopeNote = "scopeNote",
  }

  export namespace Relations {
    export namespace Parents {
      export enum ObjectTypes {
        SkillGroup = CommonGroupTypes.SkillGroup,
      }
    }

    export namespace Children {
      export enum ObjectTypes {
        Skill = CommonGroupTypes.Skill,
        SkillGroup = CommonGroupTypes.SkillGroup,
      }
    }
  }
}

export default SkillGroupEnums;
