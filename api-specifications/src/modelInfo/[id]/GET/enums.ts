// Error codes for the GET /models/{modelId} endpoint.
namespace GETModelEnums {
  export namespace Response {
    // 404: model not found (missing or invalid id, no match, or unreleased model for a non-manager)
    export namespace Status404 {
      export enum ErrorCodes {
        MODEL_NOT_FOUND_BY_ID = "MODEL_NOT_FOUND_BY_ID",
      }
    }

    // 500: the database failed while retrieving the model
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_MODEL = "DB_FAILED_TO_RETRIEVE_MODEL",
      }
    }
  }
}

export default GETModelEnums;
