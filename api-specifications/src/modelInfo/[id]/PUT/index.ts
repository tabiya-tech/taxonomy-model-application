import PUTModelEnums from "./enums";
import PUTModelConstants from "./constants";
import PUTModelTypes from "./types";
import SchemaPUTRequest from "./schema.request";
import SchemaPUTResponse from "./schema.response";

// ─── PUT /models/{modelId} ───
namespace PUTModelOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPUTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPUTResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = PUTModelTypes.Request.Payload;
    }
    export namespace Response {
      export type Payload = PUTModelTypes.Response.Payload;
    }
  }
  export import Enums = PUTModelEnums;
  export import Constants = PUTModelConstants;
}

export default PUTModelOperation;
