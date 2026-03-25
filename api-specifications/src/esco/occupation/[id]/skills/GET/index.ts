import OccupationTypes from "../../../_shared/types";
import GETOccupationSkillsErrors from "./enums";
import SchemaGETSkillsResponse from "./schema.response";
import SchemaGETSkillsRequestQueryParam from "./schema.request.query.param";

// ─── Detail.skills.GET ───
namespace Detail.skills.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETSkillsResponse;
    }
    export namespace Request {
      export namespace Query {
        export const Payload = SchemaGETSkillsRequestQueryParam;
      }
    }
  }
  export namespace Types {
    export namespace Response {
      export type SkillItem = OccupationTypes.Detail.skills.GET.Response.SkillItem;
      export type Payload = OccupationTypes.Detail.skills.GET.Response.Payload;
    }
    export namespace Request {
      export namespace Query {
        export type Payload = OccupationTypes.Detail.skills.GET.Request.Query.Payload;
      }
    }
  }
  export import Errors = GETOccupationSkillsErrors;
}

export default Detail.skills.GETOperation;
