import SkillEnums from "../_shared/enums";
import SkillTypes from "../_shared/types";
import GETSkillsErrors from "./enums";
import SchemaGETResponse from "./schema.response";
import SchemaGETRequestParam from "./schema.request.param";
import SchemaGETRequestQueryParam from "./schema.request.query.param";

namespace GETSkillsOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
    export namespace Request {
      export namespace Param {
        export const Payload = SchemaGETRequestParam;
      }
      export namespace Query {
        export const Payload = SchemaGETRequestQueryParam;
      }
    }
  }

  export namespace Types {
    export namespace Response {
      export type SkillItem = SkillTypes.GETSkills.Response.SkillItem;
      export type Payload = SkillTypes.GETSkills.Response.Payload;
    }
    export namespace Request {
      export namespace Param {
        export type Payload = SkillTypes.GETSkills.Request.Param.Payload;
      }
      export namespace Query {
        export type Payload = SkillTypes.GETSkills.Request.Query.Payload;
      }
    }
  }

  export import Errors = GETSkillsErrors;
  export import Enums = SkillEnums;
}

export default GETSkillsOperation;
