import PATCHSkillOccupationsErrors from "./enums";
import SchemaPATCHRequest from "./schema.request";
import SchemaPATCHResponse from "./schema.response";
import PATCHSkillOccupationsTypes from "./types";

namespace Detail.occupations.PATCHOperation {
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
      export type Payload = PATCHSkillOccupationsTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = PATCHSkillOccupationsTypes.Response.Payload;
    }
  }
  export import Errors = PATCHSkillOccupationsErrors;
}

export default Detail.occupations.PATCHOperation;
