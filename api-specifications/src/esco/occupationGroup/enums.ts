namespace OccupationGroupEnums {
  export namespace ENUMS {
    export enum ObjectTypes {
      ISCOGroup = "iscogroup",
      LocalGroup = "localgroup",
      ESCOOccupation = "escooccupation",
      LocalOccupation = "localoccupation",
      Skill = "skill",
      SkillGroup = "skillgroup",
    }
    export enum SignallingValueLabel {
      NONE = "",
      HIGH = "high",
      MEDIUM = "medium",
      LOW = "low",
    }
  }
  export namespace GET {
    export namespace Response {
      export enum ErrorCodes {
        DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS = "DB_FAILED_TO_RETRIEVE_OCCUPATION_GROUPS",
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
