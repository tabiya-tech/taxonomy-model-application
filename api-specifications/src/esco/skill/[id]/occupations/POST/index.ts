import POSTSkillOccupationsErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import POSTSkillOccupationsTypes from "./types";

namespace Detail.occupations.POSTOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = POSTSkillOccupationsTypes.Request.Payload;
    }
  }
  export import Errors = POSTSkillOccupationsErrors;
}

export default Detail.occupations.POSTOperation;
