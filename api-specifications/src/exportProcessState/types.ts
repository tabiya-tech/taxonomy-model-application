import { ExportProcessState } from "./enums";

namespace ExportProcessStateTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  // ---

  export type Result = {
    errored: boolean;
    exportErrors: boolean;
    exportWarnings: boolean;
  };
  export namespace GET {
    export namespace Response {
      export interface Payload {
        id: string;
        modelId: string;
        status: ExportProcessState.Enums.Status;
        result: ExportProcessStateTypes.Result;
        downloadUrl: string;
        timestamp: string;
        createdAt: string;
        updatedAt: string;
      }
    }
  }
}

export default ExportProcessStateTypes;
