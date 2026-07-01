namespace GETSkillGroupHistoryEnums {
  export namespace Response {
    export namespace Status400 {
      export enum ErrorCodes {}
    }
    export namespace Status404 {
      export enum ErrorCodes {
        SKILL_GROUP_NOT_FOUND = "SKILL_GROUP_NOT_FOUND",
        MODEL_NOT_FOUND = "GET_MODEL_NOT_FOUND",
      }
    }
    export namespace Status500 {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_SKILL_GROUP_HISTORY = "DB_FAILED_TO_RETRIEVE_SKILL_GROUP_HISTORY",
      }
    }
  }
}

export default GETSkillGroupHistoryEnums;
