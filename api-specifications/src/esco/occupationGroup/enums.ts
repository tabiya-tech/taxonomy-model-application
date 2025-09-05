namespace OccupationGroupEnums {
  export enum ObjectTypes {
    ISCOGroup = "iscogroup",
    LocalGroup = "localgroup",
    ESCOOccupation = "escooccupation",
    LocalOccupation = "localoccupation",
    Skill = "skill",
    SkillGroup = "skillgroup",
  }
  export namespace GET {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS = "DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS",
        INVALID_LIMIT_PARAMETER = "INVALID_LIMIT_PARAMETER",
        INVALID_NEXT_CURSOR_PARAMETER = "INVALID_NEXT_CURSOR_PARAMETER",
      }
    }
  }
  export namespace POST {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_CREATE_OCCUPATION_GROUP = "DB_FAILED_TO_CREATE_OCCUPATION_GROUP",
        OCCUPATION_GROUP_COULD_NOT_VALIDATE = "OCCUPATION_GROUP_COULD_NOT_VALIDATE",
      }
    }
  }
}

export default OccupationGroupEnums;
