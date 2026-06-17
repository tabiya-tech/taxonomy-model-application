import POSTSkillRelatedErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import SchemaPOSTResponse from "./schema.response";
import POSTSkillRelatedTypes from "./types";

namespace Detail.relatedSkills.POSTOperation {
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
      export type Payload = POSTSkillRelatedTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = POSTSkillRelatedTypes.Response.Payload;
    }
  }
  export import Errors = POSTSkillRelatedErrors;
}

export default Detail.relatedSkills.POSTOperation;
