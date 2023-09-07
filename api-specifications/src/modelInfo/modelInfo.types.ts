import Locale from '../locale';
import ImportProcessState from "../importProcessState";
// Have a common supertype for all the responses to inherit from
// These types are hidden because they should only be referenced through the index.
interface IModelInfoResponse extends IModelInfoRequest {
  id: string;
  UUID: string;
  originUUID: string;
  previousUUID: string;
  path: string;
  tabiyaPath: string;
  released: boolean;
  releaseNotes: string;
  version: string;
  importProcessState: {
    id: string;
    status: ImportProcessState.Enums.Status;
    result: {
      errored: boolean;
      parsingErrors: boolean;
      parsingWarnings: boolean;
    }
  }
  createdAt: string;
  updatedAt: string;
}

interface IModelInfoRequest {
  name: string;
  description: string;
  locale: Locale.Payload;
}

namespace ModelInfoTypes {
  export namespace POST {
    export namespace Response {
      export type Payload = IModelInfoResponse
    }
    export namespace Request {
      export type Payload = IModelInfoRequest;
    }
  }
  export namespace GET {
    export namespace Response {
      export type Payload = IModelInfoResponse;
    }
    export namespace Request {
      export type Payload = IModelInfoRequest;
    }
  }
}

export default ModelInfoTypes;
