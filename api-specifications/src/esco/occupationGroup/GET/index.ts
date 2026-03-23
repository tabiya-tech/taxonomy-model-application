import SchemaGETRequestPathParam from "./schema.request.param";
import SchemaGETRequestQueryParam from "./schema.request.query.param";
import SchemaGETResponse from "./schema.response";
import OccupationGroupGETConstants from "./constants";
import OccupationGroupGETTypes from "./types";
import GETOccupationGroupEnums from "./enums";

namespace OccupationGroupGETSchemas {
  export namespace Request {
    export namespace Param {
      export const Payload = SchemaGETRequestPathParam;
    }
    export namespace Query {
      export const Payload = SchemaGETRequestQueryParam;
    }
  }
  export namespace Response {
    export const Payload = SchemaGETResponse;
  }
}

namespace OccupationGroupGETAPISpecs {
  export import Schemas = OccupationGroupGETSchemas;
  export import Types = OccupationGroupGETTypes;
  export import Constants = OccupationGroupGETConstants;
  export import Enums = GETOccupationGroupEnums;
}
export default OccupationGroupGETAPISpecs;
