import EmbeddingProcessStatesEnums from "../enums";

namespace POSTEmbeddingProcessStatesTypes {
  export namespace POST {
    export namespace Request {
      export interface Payload {
        embeddingServiceId: string;
      }
    }

    export namespace Response {
      export interface Payload {
        id: string;
        modelId: string;
        status: EmbeddingProcessStatesEnums.Status;
        embeddingServiceId: string;
        totalDocuments: number;
        errorCounts: number;
        warningCounts: number;
        completedDocuments: number;
        createdAt: string;
        updatedAt: string;
      }
    }
  }
}

export default POSTEmbeddingProcessStatesTypes;
