import SkillEnums from "../../../_shared/enums";
import SkillTypes from "../../../_shared/types";

namespace PATCHSkillRelatedTypes {
  export namespace Request {
    export type Payload = {
      requiredSkillId: string;
      relationType?: SkillEnums.SkillToSkillRelationType;
    };
  }
  export namespace Response {
    export type Payload = SkillTypes.Response.ISkill & {
      relationType: SkillEnums.SkillToSkillRelationType;
    };
  }
}

export default PATCHSkillRelatedTypes;
