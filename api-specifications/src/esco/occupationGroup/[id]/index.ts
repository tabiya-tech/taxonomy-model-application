import OccupationGroupGETDetailAPISpecs from "./GET";
import OccupationGroupGETParentAPISpecs from "./parent";
import OccupationGroupGETChildrenAPISpecs from "./children";

import SchemaGETRequestDetailParam from "./schema.request.param";

import OccupationGroupDetailURLParameter from "./types";

namespace OccupationGroupDetailParamSchemas {
  export namespace Request {
    export namespace Param {
      export const Payload = SchemaGETRequestDetailParam;
    }
  }
}

namespace OccupationGroupDetailAPISpecs {
  export import Schemas = OccupationGroupDetailParamSchemas;
  export import Types = OccupationGroupDetailURLParameter;

  export import GETDetailAPISpecs = OccupationGroupGETDetailAPISpecs;
  export import GETParentAPISpecs = OccupationGroupGETParentAPISpecs;
  export import GETChildrenAPISpecs = OccupationGroupGETChildrenAPISpecs;
}
export default OccupationGroupDetailAPISpecs;
