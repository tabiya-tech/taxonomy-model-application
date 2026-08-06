import PATCHSkillRelatedErrors from "./enums";
import SchemaPATCHRequest from "./schema.request";
import SchemaPATCHResponse from "./schema.response";
import PATCHSkillRelatedTypes from "./types";

namespace Detail.relatedSkills.PATCHOperation {
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
      export type Payload = PATCHSkillRelatedTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = PATCHSkillRelatedTypes.Response.Payload;
    }
  }
  export import Errors = PATCHSkillRelatedErrors;
}

export default Detail.relatedSkills.PATCHOperation;
