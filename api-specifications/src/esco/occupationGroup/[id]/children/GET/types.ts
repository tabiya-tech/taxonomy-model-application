import {
  IOccupationGroupDetailParam,
  IOccupationGroupChildResponse,
  PaginatedOccupationGroupChildrenResponse,
} from "../../../_shared/types";

namespace OccupationGroupGETChildrenTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type Payload = PaginatedOccupationGroupChildrenResponse;
    export namespace Child {
      export type Payload = IOccupationGroupChildResponse;
    }
  }
  export namespace Request {
    export namespace Param {
      export type Payload = IOccupationGroupDetailParam;
    }
  }
}

export default OccupationGroupGETChildrenTypes;
