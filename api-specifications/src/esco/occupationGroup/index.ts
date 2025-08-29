import OccupationGroupConstants from "./constants";
import OccupationGroupEnums from "./enums";
import OccupationGroupTypes from "./types";

import SchemaGETResponse from "./schema.GET.response";
import SchemaPOSTRequest from "./schema.POST.request";
import SchemaPOSTResponse from "./schema.POST.response";

namespace OccupationGroupSchemas {
  export namespace GET {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
  }
  export namespace POST {
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
  }
}

namespace OccupationGroupAPISpecs {
  export import Enums = OccupationGroupEnums;
  export import Types = OccupationGroupTypes;
  export import Constants = OccupationGroupConstants;
  export import Schemas = OccupationGroupSchemas;
}

export default OccupationGroupAPISpecs;
