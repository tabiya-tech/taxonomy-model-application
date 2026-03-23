import SchemaPOSTRequest from "./schema.request";
import SchemaPOSTResponse from "./schema.response";
import POSTOccupationGroupEnums from "./enums";
import OccupationGroupPOSTTypes from "./types";
import OccupationGroupPOSTConstants from "./constants";

namespace OccupationGroupPOSTSchemas {
  export namespace Request {
    export const Payload = SchemaPOSTRequest;
  }
  export namespace Response {
    export const Payload = SchemaPOSTResponse;
  }
}
namespace OccupationGroupPOSTAPISpecs {
  export import Schemas = OccupationGroupPOSTSchemas;
  export import Types = OccupationGroupPOSTTypes;
  export import Enums = POSTOccupationGroupEnums;
  export import Constants = OccupationGroupPOSTConstants;
}
export default OccupationGroupPOSTAPISpecs;
