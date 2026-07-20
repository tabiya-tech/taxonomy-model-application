import ModelInfoTypes from "../../types";

namespace PATCHModelTypes {
  export namespace Request {
    export interface Payload {
      released: true;
      releaseNotes?: string;
    }
  }
  export namespace Response {
    export type Payload = ModelInfoTypes.Response.IModelInfo;
  }
}

export default PATCHModelTypes;
