import OccupationGroupTypes from "../../../_shared/types";
import GETOccupationGroupHistoryEnums from "./enums";
import SchemaGETHistoryResponse from "./schema.response";

namespace Detail.history.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETHistoryResponse;
    }
  }

  export namespace Types {
    export namespace Response {
      export type HistoryItem = OccupationGroupTypes.Detail.history.GET.Response.HistoryItem;
      export type Payload = OccupationGroupTypes.Detail.history.GET.Response.Payload;
    }
  }

  export import Enums = GETOccupationGroupHistoryEnums;
}

export default Detail.history.GETOperation;
