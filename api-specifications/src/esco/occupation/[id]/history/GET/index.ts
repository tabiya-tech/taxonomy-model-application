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
      export type HistoryItem = OccupationTypes.Detail.history.GET.Response.HistoryItem;
      export type Payload = OccupationTypes.Detail.history.GET.Response.Payload;
    }
  }
  export import Errors = GETOccupationHistoryErrors;
}

export default Detail.history.GETOperation;
