import POSTOccupationSkillsErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTOccupationSkillsTypes from "./types";

namespace Detail.skills.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = POSTOccupationSkillsTypes.Request.Payload;
    }
  }
  export import Errors = POSTOccupationSkillsErrors;
}

export default Detail.skills.POSTOperation;
