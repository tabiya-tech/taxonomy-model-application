import SchemaGETOccupationGroupParentResponse from "./schema.parent.response";
import GETOccupationGroupParentEnums from "./enums";
import OccupationGroupGETParentTypes from "./types";

namespace OccupationGroupGETParentSchemas {
  export namespace Response {
    export const Payload = SchemaGETOccupationGroupParentResponse;
  }
}
namespace OccupationGroupGETParentAPISpecs {
  export import Schemas = OccupationGroupGETParentSchemas;
  export import Types = OccupationGroupGETParentTypes;
  export import Enums = GETOccupationGroupParentEnums;
}
export default OccupationGroupGETParentAPISpecs;
