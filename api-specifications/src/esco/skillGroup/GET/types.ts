import { ISkillGroupParam, ISkillGroupQueryParams, PaginatedSkillGroupResponse } from "../_shared/types";

namespace SkillGroupGETTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type Payload = PaginatedSkillGroupResponse;
  }
  export namespace Request {
    export namespace Param {
      export type Payload = ISkillGroupParam;
    }
    export namespace Query {
      export type Payload = ISkillGroupQueryParams;
    }
  }
}

export default SkillGroupGETTypes;
