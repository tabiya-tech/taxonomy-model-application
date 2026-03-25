namespace GETOccupationParentErrors {
  export namespace Status400 {
    export enum ErrorCodes {
      INVALID_OCCUPATION_ID = "INVALID_OCCUPATION_ID",
    }
  }
  export namespace Status404 {
    export enum ErrorCodes {
      OCCUPATION_NOT_FOUND = "OCCUPATION_NOT_FOUND",
    }
  }
  export namespace Status500 {
    export enum ErrorCodes {
      DB_FAILED_TO_RETRIEVE_OCCUPATION_PARENT = "DB_FAILED_TO_RETRIEVE_OCCUPATION_PARENT",
    }
  }
}

export default GETOccupationParentErrors;
