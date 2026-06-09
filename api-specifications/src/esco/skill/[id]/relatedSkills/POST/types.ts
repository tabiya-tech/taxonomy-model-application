import SkillEnums from "../../../_shared/enums";

namespace POSTSkillRelatedTypes {
  export namespace Request {
    export type Payload = {
      requiredSkillId: string;
      relationType: SkillEnums.SkillToSkillRelationType;
    };
  }
}

export default POSTSkillRelatedTypes;
