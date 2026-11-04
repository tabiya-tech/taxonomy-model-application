import OccupationGroupTypes from "../../../_shared/types";
import { IOccupationGroupPATCHParentRequest } from "../../../_shared/types";

namespace PATCHOccupationGroupParentTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Request {
    export type Payload = IOccupationGroupPATCHParentRequest;
  }
  export namespace Response {
    export type Payload = OccupationGroupTypes.Response.IOccupationGroup | null;
  }
}

export default PATCHOccupationGroupParentTypes;
