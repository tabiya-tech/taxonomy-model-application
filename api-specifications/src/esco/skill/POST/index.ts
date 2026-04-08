import SkillEnums from "../_shared/enums";
import SkillTypes from "../_shared/types";
import SkillConstants from "../_shared/constants";
import POSTSkillErrors from "./enums";
import SchemaPOSTRequest from "./schema.request";
import SchemaPOSTResponse from "./schema.response";
import SchemaPOSTRequestParam from "./schema.request.param";

namespace POSTSkillOperation {
  export namespace Schemas {
    export namespace Request {
      export namespace Param {
        export const Payload = SchemaPOSTRequestParam;
      }
      export const Payload = SchemaPOSTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }
  }

  export namespace Types {
    export namespace Request {
      export namespace Param {
        export type Payload = SkillTypes.POSTSkill.Request.Param.Payload;
      }
      export type Payload = SkillTypes.POSTSkill.Request.Payload;
    }
    export namespace Response {
      export type Payload = SkillTypes.POSTSkill.Response.Payload;
    }
  }

  export import Constants = SkillConstants;
  export import Errors = POSTSkillErrors;
  export import Enums = SkillEnums;
}

export default POSTSkillOperation;
