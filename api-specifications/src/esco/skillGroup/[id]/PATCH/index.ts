import SchemaPATCHRequest from "./schema.request";
import SchemaPATCHResponse from "./schema.response";
import SkillGroupEnums from "../../_shared/enums";
import SkillGroupTypes from "../../_shared/types";
import PATCHSkillGroupErrors from "./enums";
import SkillGroupPATCHConstants from "./constants";

namespace PATCHSkillGroupOperation {
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
      export type Payload = SkillGroupTypes.Detail.PATCH.Request.Payload;
    }
    export namespace Response {
      export type Payload = SkillGroupTypes.Detail.PATCH.Response.Payload;
    }
  }
  export import Errors = PATCHSkillGroupErrors;
  export import Constants = SkillGroupPATCHConstants;
  export import Enums = SkillGroupEnums;
}

export default PATCHSkillGroupOperation;
