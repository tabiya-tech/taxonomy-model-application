namespace GETOccupationChildrenErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
      INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
      INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      OCCUPATION_NOT_FOUND = "OCCUPATION_NOT_FOUND",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_RETRIEVE_OCCUPATION_CHILDREN = "DB_FAILED_TO_RETRIEVE_OCCUPATION_CHILDREN",
    }
  }
}

export default GETOccupationChildrenErrors;
