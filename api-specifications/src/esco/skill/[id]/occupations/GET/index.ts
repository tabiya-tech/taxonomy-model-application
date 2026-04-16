import SkillTypes from "../../../_shared/types";
import SchemaGETOccupationsResponse from "./schema.response";
import SchemaGETOccupationsRequestQuery from "./schema.request.query.param";

namespace Detail.occupations.GETOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETOccupationsResponse;
    }
    export namespace Request {
      export namespace Query {
        export const Payload = SchemaGETOccupationsRequestQuery;
      }
    }
  }

  export namespace Types {
    export namespace Response {
      export type Payload = SkillTypes.Detail.Occupations.GET.Response.Payload;
    }
    export namespace Request {
      export namespace Query {
        export type Payload = SkillTypes.Detail.Occupations.GET.Request.Query.Payload;
      }
    }
  }
}

export default Detail.occupations.GETOperation;
