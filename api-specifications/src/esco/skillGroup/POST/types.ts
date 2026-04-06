import { ISkillGroupResponse, ISkillGroupRequest, ISkillGroupParam } from "../_shared/types";

namespace SkillGroupPOSTTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type Payload = ISkillGroupResponse;
  }
  export namespace Request {
    export type Payload = ISkillGroupRequest;
    export namespace Param {
      export type Payload = ISkillGroupParam;
    }
  }
}

export default SkillGroupPOSTTypes;
