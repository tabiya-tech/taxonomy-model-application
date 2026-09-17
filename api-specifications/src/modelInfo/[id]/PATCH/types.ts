import ModelInfoTypes from "../../types";

namespace PATCHModelTypes {
  export namespace Request {
    /**
     * The payload of a model patch. Every field is optional on its own, but a payload must carry at least one of
     * them, see ./schema.request.ts.
     */
    export interface Payload {
      released?: true;
      releaseNotes?: string;
      availableLanguages?: string[];
    }
  }
  export namespace Response {
    export type Payload = ModelInfoTypes.Response.IModelInfo;
  }
}

export default PATCHModelTypes;
