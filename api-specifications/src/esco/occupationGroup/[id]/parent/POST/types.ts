import OccupationGroupTypes from "../../../_shared/types";
import { IOccupationGroupPOSTParentRequest } from "../../../_shared/types";

namespace POSTOccupationGroupParentTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Request {
    export type Payload = IOccupationGroupPOSTParentRequest;
  }
  export namespace Response {
    export type Payload = OccupationGroupTypes.Response.IOccupationGroup | null;
  }
}

export default POSTOccupationGroupParentTypes;
