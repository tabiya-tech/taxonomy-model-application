import SkillTypes from "../../_shared/types";
import SchemaGETDetailRequestParam from "./schema.request.param";
import SchemaGETResponseById from "./schema.response";

namespace Detail.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETResponseById;
    }
    export namespace Request {
      export namespace Param {
        export const Payload = SchemaGETDetailRequestParam;
      }
    }
  }

  export namespace Types {
    export namespace Response {
      export type Payload = SkillTypes.Detail.GET.Response.Payload;
    }
    export namespace Request {
      export namespace Detail {
        export namespace Param {
          export type Payload = SkillTypes.Detail.GET.Request.Param.Payload;
        }
      }
    }
  }
}

export default Detail.GETOperation;
