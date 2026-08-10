import SchemaPUTRequest from "./schema.request";
import SchemaPUTResponse from "./schema.response";
import SkillGroupEnums from "../../_shared/enums";
import SkillGroupTypes from "../../_shared/types";
import PUTSkillGroupErrors from "./enums";
import SkillGroupPUTConstants from "./constants";

namespace PUTSkillGroupOperation {
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
      export type Payload = SkillGroupTypes.Detail.PUT.Request.Payload;
    }
    export namespace Response {
      export type Payload = SkillGroupTypes.Detail.PUT.Response.Payload;
    }
  }
  export import Errors = PUTSkillGroupErrors;
  export import Constants = SkillGroupPUTConstants;
  export import Enums = SkillGroupEnums;
}

export default PUTSkillGroupOperation;
