import OccupationEnums from "../../../_shared/enums";
import OccupationTypes from "../../../_shared/types";
import SchemaGETChildrenResponse from "./schema.response";
import SchemaGETChildrenRequestQueryParam from "./schema.request.query.param";

// ─── Detail.children.GET ───
namespace Detail.children.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETChildrenResponse;
    }
    export namespace Request {
      export namespace Query {
        export const Payload = SchemaGETChildrenRequestQueryParam;
      }
    }
  }
  export namespace Types {
    export namespace Response {
      export type ChildItem = OccupationTypes.Detail.children.GET.Response.ChildItem;
      export type Payload = OccupationTypes.Detail.children.GET.Response.Payload;
    }
    export namespace Request {
      export namespace Query {
        export type Payload = OccupationTypes.Detail.children.GET.Request.Query.Payload;
      }
    }
  }
  export import Errors = OccupationEnums.GETChildrenErrors;
}

export default Detail.children.GETOperation;
