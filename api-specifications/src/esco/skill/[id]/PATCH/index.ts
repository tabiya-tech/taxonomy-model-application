import SkillEnums from "../../_shared/enums";
import SkillTypes from "../../_shared/types";
import PATCHSkillErrors from "./enums";
import PATCHSkillConstants from "./constants";
import SchemaPATCHRequest from "./schema.request";
import SchemaPATCHResponse from "./schema.response";

namespace PATCHSkillOperation {
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
      export type Payload = SkillTypes.Detail.PATCH.Request.Payload;
    }
    export namespace Response {
      export type Payload = SkillTypes.Detail.PATCH.Response.Payload;
    }
  }
  export import Errors = PATCHSkillErrors;
  export import Constants = PATCHSkillConstants;
  export import Enums = SkillEnums;
}

export default PATCHSkillOperation;
