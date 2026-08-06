import PATCHSkillParentsErrors from "./enums";
import SchemaPATCHRequest from "./schema.request";
import SchemaPATCHResponse from "./schema.response";
import PATCHSkillParentsTypes from "./types";

namespace Detail.parents.PATCHOperation {
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
      export type Payload = PATCHSkillParentsTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = PATCHSkillParentsTypes.Response.Payload;
    }
  }
  export import Errors = PATCHSkillParentsErrors;
}

export default Detail.parents.PATCHOperation;
