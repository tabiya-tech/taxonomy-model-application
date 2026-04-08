import SkillTypes from "../../../_shared/types";
import SchemaGETChildrenResponse from "./schema.response";
import SchemaGETChildrenRequestQuery from "./schema.request.query.param";

namespace Detail.children.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETChildrenResponse;
    }
    export namespace Request {
      export namespace Query {
        export const Payload = SchemaGETChildrenRequestQuery;
      }
    }
  }

  export namespace Types {
    export namespace Response {
      export type Payload = SkillTypes.Detail.Children.GET.Response.Payload;
    }
    export namespace Request {
      export namespace Query {
        export type Payload = SkillTypes.Detail.Children.GET.Request.Query.Payload;
      }
    }
  }
}

export default Detail.children.GETOperation;
