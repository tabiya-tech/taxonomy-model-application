import POSTEmbeddingProcessStatesEnums from "./enums";
import POSTEmbeddingProcessStatesTypes from "./types";
import EmbeddingProcessStatesConstants from "./constants";

import SchemaPOSTRequest from "./schema.request";
import SchemaPOSTResponse from "./schema.response";

// ─── POST /models/{modelId}/embedding-process-states ───
namespace POSTEmbeddingProcessStatesOperation {
  export namespace Schemas {
    export namespace Request {
      export const Payload = SchemaPOSTRequest;
    }
    export namespace Response {
      export const Payload = SchemaPOSTResponse;
    }
  }
  export namespace Types {
    export namespace Request {
      export type Payload = POSTEmbeddingProcessStatesTypes.POST.Request.Payload;
    }
    export namespace Response {
      export type Payload = POSTEmbeddingProcessStatesTypes.POST.Response.Payload;
    }
  }
  export import Enums = POSTEmbeddingProcessStatesEnums;
  export import Constants = EmbeddingProcessStatesConstants;
}

export default POSTEmbeddingProcessStatesOperation;
