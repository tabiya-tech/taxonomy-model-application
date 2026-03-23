import SchemaGETResponseDetail from "./schema.response";
import OccupationGroupGETDetailResponse from "./types";
import GETOccupationGroupDetailEnums from "./enums";

namespace OccupationGroupGETDetailSchemas {
  export namespace Response {
    export const Payload = SchemaGETResponseDetail;
  }
}

namespace OccupationGroupGETDetailAPISpecs {
  export import Schemas = OccupationGroupGETDetailSchemas;
  export import Types = OccupationGroupGETDetailResponse;
  export import Enums = GETOccupationGroupDetailEnums;
}
export default OccupationGroupGETDetailAPISpecs;
