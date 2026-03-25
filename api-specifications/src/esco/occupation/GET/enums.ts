namespace GETOccupationsErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
      INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
      INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
      INVALID_MODEL_ID = "INVALID_MODEL_ID",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      OCCUPATION_NOT_FOUND = "OCCUPATION_NOT_FOUND",
      MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_RETRIEVE_OCCUPATIONS = "DB_FAILED_TO_RETRIEVE_OCCUPATIONS",
    }
  }
}

export default GETOccupationsErrors;
