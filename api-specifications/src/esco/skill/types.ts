import SkillEnums from "./enums";
import { ISkillParentResponse } from "./relations/parents/types";
import { ISkillChildrenResponse, ISkillChildrenRequestQuery } from "./relations/children/types";
import { ISkillOccupationsResponse, ISkillOccupationsRequestQuery } from "./relations/occupations/types";
import { ISkillRelatedResponse, ISkillRelatedRequestQuery } from "./relations/related/types";

interface ISkillResponse {
  id: string;
  UUID: string;
  UUIDHistory: string[];
  originUUID: string;
  path: string;
  tabiyaPath: string;
  preferredLabel: string;
  originUri: string;
  altLabels: string[];
  definition: string;
  description: string;
  scopeNote: string;
  skillType: SkillEnums.SkillType;
  reuseLevel: SkillEnums.ReuseLevel;
  isLocalized: boolean;
  objectType: SkillEnums.ObjectTypes.Skill;
  skillGroupCode: string;
  modelId: string;
  parent: {
    id: string;
    UUID: string;
    preferredLabel: string;
    objectType: SkillEnums.Relations.Parents.ObjectTypes;
    code?: string;
  } | null;
  children: {
    id: string;
    UUID: string;
    preferredLabel: string;
    objectType: SkillEnums.Relations.Children.ObjectTypes;
    code?: string;
    isLocalized?: boolean;
  }[];
  requiresSkills: {
    id: string;
    UUID: string;
    preferredLabel: string;
    isLocalized: boolean;
    objectType: SkillEnums.ObjectTypes.Skill;
    relationType: SkillEnums.SkillToSkillRelationType;
  }[];
  requiredBySkills: {
    id: string;
    UUID: string;
    preferredLabel: string;
    isLocalized: boolean;
    objectType: SkillEnums.ObjectTypes.Skill;
    relationType: SkillEnums.SkillToSkillRelationType;
  }[];
  requiredByOccupations: {
    id: string;
    UUID: string;
    preferredLabel: string;
    isLocalized: boolean;
    objectType: SkillEnums.OccupationObjectTypes;
    relationType: SkillEnums.OccupationToSkillRelationType | null;
    signallingValue: number | null;
    signallingValueLabel: SkillEnums.SignallingValueLabel | null;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface ISkillRequest {
  preferredLabel: string;
  originUri: string;
  altLabels: string[];
  definition: string;
  description: string;
  scopeNote: string;
  skillType: SkillEnums.SkillType;
  reuseLevel: SkillEnums.ReuseLevel;
  modelId: string;
  UUIDHistory: string[];
  isLocalized: boolean;
}

interface PaginatedSkillResponse {
  data: ISkillResponse[];
  limit: number;
  nextCursor: string | null;
}

interface ISkillParam {
  modelId: string;
}

interface ISkillDetailParam {
  modelId: string;
  id: string;
}

interface ISkillQueryParams {
  limit?: number;
  cursor?: string;
}

namespace SkillTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;

  export namespace Response {
    export type ISkill = ISkillResponse;
  }

  export namespace POST {
    export namespace Request {
      export type Payload = ISkillRequest;
      export namespace Param {
        export type Payload = ISkillParam;
      }
    }
    export namespace Response {
      export type Payload = ISkillResponse;
    }
  }

  export namespace GET {
    export namespace Response {
      export type SkillItem = ISkillResponse;
      export type Payload = PaginatedSkillResponse;
      export namespace ById {
        export type Payload = ISkillResponse;
      }
    }
    export namespace Request {
      export namespace Param {
        export type Payload = ISkillParam;
      }
      export namespace Query {
        export type Payload = ISkillQueryParams;
      }
      export namespace Detail {
        export namespace Param {
          export type Payload = ISkillDetailParam;
        }
      }
    }
    // Relation types
    export namespace Parent {
      export namespace Response {
        export type Payload = ISkillParentResponse;
      }
    }
    export namespace Children {
      export namespace Response {
        export type Payload = ISkillChildrenResponse;
      }
      export namespace Request {
        export namespace Query {
          export type Payload = ISkillChildrenRequestQuery;
        }
      }
    }
    export namespace Occupations {
      export namespace Response {
        export type Payload = ISkillOccupationsResponse;
      }
      export namespace Request {
        export namespace Query {
          export type Payload = ISkillOccupationsRequestQuery;
        }
      }
    }
    export namespace Related {
      export namespace Response {
        export type Payload = ISkillRelatedResponse;
      }
      export namespace Request {
        export namespace Query {
          export type Payload = ISkillRelatedRequestQuery;
        }
      }
    }
  }
}

export default SkillTypes;
