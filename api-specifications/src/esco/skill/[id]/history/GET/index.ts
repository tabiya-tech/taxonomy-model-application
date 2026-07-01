import SkillTypes from "../../../_shared/types";
import SchemaGETHistoryResponse from "./schema.response";

namespace Detail.history.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETHistoryResponse;
    }
  }

  export namespace Types {
    export namespace Response {
      export type ModelInfoItem = SkillTypes.Detail.History.GET.Response.ModelInfoItem;
      export type Payload = SkillTypes.Detail.History.GET.Response.Payload;
    }
  }
}

export default Detail.history.GETOperation;
