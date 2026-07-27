import PATCHOccupationSkillsErrors from "./enums";
import SchemaPATCHRequest from "./schema.request";
import PATCHOccupationSkillsTypes from "./types";
import SchemaPATCHResponse from "./schema.response";

namespace Detail.skills.PATCHOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPATCHRequest;
    }
    export namespace Response {
      export const Payload = SchemaPATCHResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = PATCHOccupationSkillsTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = PATCHOccupationSkillsTypes.Response.Payload;
    }
  }
  export import Errors = PATCHOccupationSkillsErrors;
}

export default Detail.skills.PATCHOperation;
