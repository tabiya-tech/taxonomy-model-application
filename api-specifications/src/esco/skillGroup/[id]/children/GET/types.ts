import {
  ISkillGroupDetailParam,
  ISkillGroupChildResponse,
  PaginatedSkillGroupChildrenResponse,
  ISkillGroupChildrenRequestQuery,
} from "../../../_shared/types";

namespace SkillGroupGETChildrenTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export namespace Children {
      export type Payload = PaginatedSkillGroupChildrenResponse;
    }
    export namespace Child {
      export type Payload = ISkillGroupChildResponse;
    }
  }
  export namespace Request {
    export namespace Param {
      export type Payload = ISkillGroupDetailParam;
    }
    export namespace Query {
      export type Payload = ISkillGroupChildrenRequestQuery;
    }
  }
}

export default SkillGroupGETChildrenTypes;
