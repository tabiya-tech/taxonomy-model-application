import ModelInfoTypes from "../../types";

// TypeScript types for the GET /models/{modelId} endpoint.
namespace GETModelTypes {
  export namespace Response {
    // Type of the response body returned on success (200)
    export type Payload = ModelInfoTypes.Response.IModelInfo;
  }
}
export default GETModelTypes;