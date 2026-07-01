import OccupationTypes from "../../../_shared/types";
import GETOccupationHistoryErrors from "./enums";
import SchemaGETHistoryResponse from "./schema.response";

namespace Detail.history.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETHistoryResponse;
    }
  }
  export namespace Types {
    export namespace Response {
      export type ModelInfoItem = OccupationTypes.Detail.history.GET.Response.ModelInfoItem;
      export type Payload = OccupationTypes.Detail.history.GET.Response.Payload;
    }
  }
  export import Errors = GETOccupationHistoryErrors;
}

export default Detail.history.GETOperation;
