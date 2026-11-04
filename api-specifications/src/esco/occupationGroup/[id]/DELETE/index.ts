import OccupationGroupTypes from "../../_shared/types";
import SchemaDELETEDetailRequestParam from "./schema.request.param";
import DELETEOccupationGroupErrors from "./enums";

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
        export type Payload = OccupationGroupTypes.Detail.DELETE.Request.Param.Payload;
      }
    }
  }
  export import Errors = DELETEOccupationGroupErrors;
}

export default Detail.DELETEOperation;
