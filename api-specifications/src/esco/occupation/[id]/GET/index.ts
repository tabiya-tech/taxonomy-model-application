import OccupationEnums from "../../_shared/enums";
import OccupationTypes from "../../_shared/types";
import SchemaGETDetailRequestParam from "./schema.request.param";

// ─── Detail.GET ───
namespace Detail.GETOperation {
  export namespace Schemas {
    export namespace Request {
      export namespace Param {
        export const Payload = SchemaGETDetailRequestParam;
      }
    }
  }
  export namespace Types {
    export namespace Request {
      export namespace Param {
        export type Payload = OccupationTypes.Detail.GET.Request.Param.Payload;
      }
    }
  }
  export import Errors = OccupationEnums.GETErrors;
}

export default Detail.GETOperation;
