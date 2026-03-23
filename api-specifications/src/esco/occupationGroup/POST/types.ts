import { IOccupationGroupResponse, IOccupationGroupRequest } from "../_shared/types";

namespace OccupationGroupPOSTTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type Payload = IOccupationGroupResponse;
  }
  export namespace Request {
    export type Payload = IOccupationGroupRequest;
  }
}
export default OccupationGroupPOSTTypes;
