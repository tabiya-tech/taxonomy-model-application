import { IOccupationGroupResponse, IOccupationGroupParam, IOccupationGroupQueryParams } from "../_shared/types";

interface PaginatedOccupationGroupResponse {
  data: IOccupationGroupResponse[];
  limit: number;
  nextCursor: string | null;
}

namespace OccupationGroupGETTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type Payload = PaginatedOccupationGroupResponse;
  }
  export namespace Request {
    export namespace Param {
      export type Payload = IOccupationGroupParam;
    }
    export namespace Query {
      export type Payload = IOccupationGroupQueryParams;
    }
  }
}

export default OccupationGroupGETTypes;
