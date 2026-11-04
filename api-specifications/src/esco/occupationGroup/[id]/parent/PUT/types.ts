import OccupationGroupTypes from "../../../_shared/types";
import { IOccupationGroupPUTParentRequest } from "../../../_shared/types";

namespace PUTOccupationGroupParentTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Request {
    export type Payload = IOccupationGroupPUTParentRequest;
  }
  export namespace Response {
    export type Payload = OccupationGroupTypes.Response.IOccupationGroup | null;
  }
}

export default PUTOccupationGroupParentTypes;
