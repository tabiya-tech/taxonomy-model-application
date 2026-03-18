import OccupationEnums from "../../../_shared/enums";
import OccupationTypes from "../../../_shared/types";
import SchemaGETParentResponse from "./schema.response";

// ─── Detail.parent.GET ───
namespace Detail.parent.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETParentResponse;
    }
  }
  export namespace Types {
    export namespace Response {
      export type Payload = OccupationTypes.Detail.parent.GET.Response.Payload;
    }
  }
  export import Errors = OccupationEnums.GETParentErrors;
}

export default Detail.parent.GETOperation;
