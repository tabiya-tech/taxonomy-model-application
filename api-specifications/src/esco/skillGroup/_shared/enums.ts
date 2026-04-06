import { ObjectTypes as CommonGroupTypes } from "../../common/objectTypes";

namespace SkillGroupEnums {
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
