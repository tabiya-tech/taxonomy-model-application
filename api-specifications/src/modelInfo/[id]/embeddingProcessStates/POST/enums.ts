namespace EmbeddingProcessStatesEnums {
  /**
   * The status of an embedding process of a model.
   */
  export enum Status {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
  }

  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {
        MODEL_NOT_RELEASED = "MODEL_NOT_RELEASED",
      }
    }
    export namespace Status404 {
      export enum ErrorCodes {
        MODEL_NOT_FOUND_BY_ID = "MODEL_NOT_FOUND_BY_ID",
      }
    }
    export namespace Status409 {
      export enum ErrorCodes {
        EMBEDDING_PROCESS_ALREADY_RUNNING = "EMBEDDING_PROCESS_ALREADY_RUNNING",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        FAILED_TO_TRIGGER_EMBEDDING_PROCESS = "FAILED_TO_TRIGGER_EMBEDDING_PROCESS",
      }
    }
  }
}

export default EmbeddingProcessStatesEnums;
