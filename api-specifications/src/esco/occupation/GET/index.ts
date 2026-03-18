import OccupationEnums from "../_shared/enums";
import OccupationTypes from "../_shared/types";
import SchemaGETResponse from "./schema.response";
import SchemaGETRequestParam from "./schema.request.param";
import SchemaGETRequestQueryParam from "./schema.request.query.param";

// ─── GETOccupations ───
namespace GETOccupationsOperation {
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
    export namespace Request {
      export namespace Param {
        export const Payload = SchemaGETRequestParam;
      }
      export namespace Query {
        export const Payload = SchemaGETRequestQueryParam;
      }
    }
  }
  export namespace Types {
    export namespace Response {
      export type OccupationItem = OccupationTypes.GETOccupations.Response.OccupationItem;
      export type Payload = OccupationTypes.GETOccupations.Response.Payload;
    }
    export namespace Request {
      export namespace Param {
        export type Payload = OccupationTypes.GETOccupations.Request.Param.Payload;
      }
      export namespace Query {
        export type Payload = OccupationTypes.GETOccupations.Request.Query.Payload;
      }
    }
  }
  export import Errors = OccupationEnums.GETErrors;
}

export default GETOccupationsOperation;
