import POSTSkillOccupationsErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import SchemaPOSTResponse from "./schema.response";
import POSTSkillOccupationsTypes from "./types";

namespace Detail.occupations.POSTOperation {
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
      export type Payload = POSTSkillOccupationsTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = POSTSkillOccupationsTypes.Response.Payload;
    }
  }
  export import Errors = POSTSkillOccupationsErrors;
}

export default Detail.occupations.POSTOperation;
