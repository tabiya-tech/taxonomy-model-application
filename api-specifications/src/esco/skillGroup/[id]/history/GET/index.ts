import SkillGroupTypes from "../../../_shared/types";
import GETSkillGroupHistoryEnums from "./enums";
import SchemaGETHistoryResponse from "./schema.response";

namespace SkillGroupHistorySchemas {
  export namespace Response {
    export const Payload = SchemaGETHistoryResponse;
  }
}

namespace GETSkillGroupHistoryOperation {
  export import Schemas = SkillGroupHistorySchemas;

  export namespace Types {
    export namespace Response {
      export type HistoryItem = SkillGroupTypes.GET.Response.History.HistoryItem;
      export type Payload = SkillGroupTypes.GET.Response.History.Payload;
    }
  }

  export import Enums = GETSkillGroupHistoryEnums;
}

export default GETSkillGroupHistoryOperation;
