import Locale from "../locale";
import ImportProcessState from "../importProcessState";
import ExportProcessState from "../exportProcessState";
// Have a common supertype for all the responses to inherit from
// These types are hidden because they should only be referenced through the index.
interface IModelInfoResponse {
  id: string;
  UUID: string;
  modelHistory: {
    id: string | null;
    UUID: string;
    name: string | null;
    version: string | null;
    localeShortCode: string | null;
  }[];
  name: string;
  description: string;
  locale: Locale.Types.Payload;
  path: string;
  tabiyaPath: string;
  released: boolean;
  releaseNotes: string;
  version: string;
  exportProcessState: {
    id: string;
    status: ExportProcessState.Enums.Status;
    result: {
      errored: boolean;
      exportErrors: boolean;
      exportWarnings: boolean;
    };
    downloadUrl: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  }[];
  importProcessState: {
    id: string;
    status: ImportProcessState.Enums.Status;
    result: {
      errored: boolean;
      parsingErrors: boolean;
      parsingWarnings: boolean;
    };
    createdAt?: string;
    updatedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface IModelInfoRequest {
  name: string;
  description: string;
  locale: Locale.Types.Payload;
  UUIDHistory: string[];
}

namespace ModelInfoTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---
  export namespace Response {
    export type IModelInfo = IModelInfoResponse;
  }
  export namespace POST {
    export namespace Response {
      export type Payload = IModelInfoResponse;
    }
    export namespace Request {
      export type Payload = IModelInfoRequest;
    }
  }
  export namespace GET {
    export namespace Response {
      export type ModelInfoItem = IModelInfoResponse;
      export type Payload = ModelInfoItem[];
    }
  }
}

export default ModelInfoTypes;
