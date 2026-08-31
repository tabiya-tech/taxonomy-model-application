import OccupationTypes from "../../_shared/types";
import SchemaDELETEDetailRequestParam from "./schema.request.param";
import DELETEOccupationErrors from "./enums";

// ─── Detail.DELETE ───
namespace Detail.DELETEOperation {
  export namespace Schemas {
    export namespace Request {
      export namespace Param {
        export const Payload = SchemaDELETEDetailRequestParam;
      }
    }
  }
  export namespace Types {
    export namespace Request {
      export namespace Param {
        export type Payload = OccupationTypes.Detail.DELETE.Request.Param.Payload;
      }
    }
  }
  export import Errors = DELETEOccupationErrors;
}

export default Detail.DELETEOperation;
