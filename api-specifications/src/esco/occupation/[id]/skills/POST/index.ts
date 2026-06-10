import POSTOccupationSkillsErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTOccupationSkillsTypes from "./types";
import SchemaPOSTResponse from "./schema.response";

namespace Detail.skills.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = POSTOccupationSkillsTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = POSTOccupationSkillsTypes.Response.Payload;
    }
  }
  export import Errors = POSTOccupationSkillsErrors;
}

export default Detail.skills.POSTOperation;
