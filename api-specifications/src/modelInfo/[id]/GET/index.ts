import SchemaGETResponse from "./schema.response";
import GETModelTypes from "./types";
import GETModelEnums from "./enums";

// Entry point for the GET /models/{modelId} specification.
// It groups the response schema, the TypeScript types and the enums in one place,
// so other code can reach them as ModelInfoAPISpecs.ModelInfo.GET.*
namespace GETModelOperation {
  // JSON schema of the response body
  export namespace Schemas {
    export namespace Response {
      export const Payload = SchemaGETResponse;
    }
  }
  // TypeScript type of the response body
  export namespace Types {
    export namespace Response {
      export type Payload = GETModelTypes.Response.Payload;
    }
  }

  // Re-export the error codes (404 and 500) under this operation
  export import Enums = GETModelEnums;
}
export default GETModelOperation;
