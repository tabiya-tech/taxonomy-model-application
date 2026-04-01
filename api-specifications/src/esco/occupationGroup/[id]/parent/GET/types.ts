import { IOccupationGroupResponse, IOccupationGroupDetailParam } from "../../../_shared/types";

namespace OccupationGroupGETParentTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type Payload = IOccupationGroupResponse;
  }
  export namespace Request {
    export namespace Param {
      export type Payload = IOccupationGroupDetailParam;
    }
  }
}

export default OccupationGroupGETParentTypes;
