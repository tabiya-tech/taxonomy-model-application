import PATCHModelEnums from "./enums";
import PATCHModelConstants from "./constants";
import PATCHModelTypes from "./types";
import SchemaPATCHRequest from "./schema.request";
import SchemaPATCHResponse from "./schema.response";

// ─── PATCH /models/{modelId} ───
namespace PATCHModelOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPATCHRequest;
    }
    export namespace Response {
      export const Payload = SchemaPATCHResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = PATCHModelTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = PATCHModelTypes.Response.Payload;
    }
  }
  export import Enums = PATCHModelEnums;
  export import Constants = PATCHModelConstants;
}

export default PATCHModelOperation;
