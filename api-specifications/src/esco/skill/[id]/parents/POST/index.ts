import POSTSkillParentsErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTSkillParentsTypes from "./types";

namespace Detail.parents.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = POSTSkillParentsTypes.Request.Payload;
    }
  }
  export import Errors = POSTSkillParentsErrors;
}

export default Detail.parents.POSTOperation;
