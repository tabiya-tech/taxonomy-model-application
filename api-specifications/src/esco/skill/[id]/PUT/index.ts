import SkillEnums from "../../_shared/enums";
import SkillTypes from "../../_shared/types";
import PUTSkillErrors from "./enums";
import PUTSkillConstants from "./constants";
import SchemaPUTRequest from "./schema.request";
import SchemaPUTResponse from "./schema.response";

namespace PUTSkillOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPUTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPUTResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = SkillTypes.Detail.PUT.Request.Payload;
    }
    export namespace Response {
      export type Payload = SkillTypes.Detail.PUT.Response.Payload;
    }
  }
  export import Errors = PUTSkillErrors;
  export import Constants = PUTSkillConstants;
  export import Enums = SkillEnums;
}

export default PUTSkillOperation;
