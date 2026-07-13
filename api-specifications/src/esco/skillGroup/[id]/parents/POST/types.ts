import SkillGroupTypes from "../../../_shared/types";
import { ISkillGroupPOSTParentsRequest } from "../../../_shared/types";

namespace POSTSkillGroupParentTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Request {
    export type Payload = ISkillGroupPOSTParentsRequest;
  }
  export namespace Response {
    export type Payload = SkillGroupTypes.Response.ISkillGroup | null;
  }
}

export default POSTSkillGroupParentTypes;
