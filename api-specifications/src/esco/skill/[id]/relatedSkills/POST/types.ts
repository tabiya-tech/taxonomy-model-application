import SkillEnums from "../../../_shared/enums";
import type { ISkillRelatedItem } from "../GET/types";

namespace POSTSkillRelatedTypes {
  export namespace Request {
    export type Payload = {
      requiredSkillId: string;
      relationType: SkillEnums.SkillToSkillRelationType;
    };
  }
  export namespace Response {
    export type Payload = ISkillRelatedItem | null;
  }
}

export default POSTSkillRelatedTypes;
