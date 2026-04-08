import SkillTypes from "../../../_shared/types";
import SchemaGETParentsResponse from "./schema.response";
import SchemaGETParentsRequestQuery from "./schema.request.query.param";

namespace Detail.parents.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETParentsResponse;
    }
    export namespace Request {
      export namespace Query {
        export const Payload = SchemaGETParentsRequestQuery;
      }
    }
  }

  export namespace Types {
    export namespace Response {
      export type ParentItem = SkillTypes.Detail.Parents.GET.Response.ParentItem;
      export type Payload = SkillTypes.Detail.Parents.GET.Response.Payload;
    }
    export namespace Request {
      export namespace Query {
        export type Payload = SkillTypes.Detail.Parents.GET.Request.Query.Payload;
      }
    }
  }
}

export default Detail.parents.GETOperation;
