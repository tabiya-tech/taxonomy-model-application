import {
  ISkillGroupParentsRequestQuery,
  PaginatedSkillGroupParentsResponse,
  ISkillGroupResponse,
} from "../../../_shared/types";

namespace OccupationGroupGETParentTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type Payload = ISkillGroupResponse;
    export namespace Parents {
      export type Payload = PaginatedSkillGroupParentsResponse;
    }
  }
  export namespace Request {
    export namespace Query {
      export type Payload = ISkillGroupParentsRequestQuery;
    }
  }
}

export default OccupationGroupGETParentTypes;
