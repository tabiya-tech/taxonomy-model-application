import {ImportProcessState} from "./enums";


namespace ImportProcessStateTypes {
  export type Result = {
    errored: boolean
    parsingErrors: boolean
    parsingWarnings: boolean
  };
  export namespace GET {
    export namespace Response {
      export interface Payload {
        id: string,
        modelId: string,
        status: ImportProcessState.Enums.Status,
        result: ImportProcessStateTypes.Result,
        createdAt: string,
        updatedAt: string
      }
    }
  }
}

export default ImportProcessStateTypes;