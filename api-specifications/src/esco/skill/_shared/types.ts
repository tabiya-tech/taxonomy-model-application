import SkillEnums from "./enums";
import ModelInfoTypes from "../../../modelInfo/types";
import { ISkillParentItem, ISkillParentsResponse, ISkillParentsRequestQuery } from "../[id]/parents/GET/types";
import { ISkillChildrenResponse, ISkillChildrenRequestQuery } from "../[id]/children/GET/types";
import { ISkillOccupationsResponse, ISkillOccupationsRequestQuery } from "../[id]/occupations/GET/types";
import { ISkillRelatedResponse, ISkillRelatedRequestQuery } from "../[id]/relatedSkills/GET/types";

// A reference to a skill — the lightweight shape used when a skill is shown from the outside (e.g. as it
// appeared in a model in its history). Mirrors the SkillReferenceSchema.
interface _ISkillReference {
  id: string;
  UUID: string;
  preferredLabel: string;
  isLocalized: boolean;
  objectType: SkillEnums.ObjectTypes.Skill;
}

// A single entry of the skill's model history: the skill's reference fields as it appeared in a model, plus a
// stripped-down reference to that model.
interface ISkillHistoryItem extends _ISkillReference {
  model: ModelInfoTypes.Response.IModelInfoReference;
}

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
  modelId: string;
  parents: {
    id: string;
    UUID: string;
    preferredLabel: string;
    objectType: SkillEnums.Relations.Parents.ObjectTypes;
    code?: string;
  }[];
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
  query?: string;
  searchFields?: string;
}

namespace SkillTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;

  export namespace Response {
    export type ISkill = ISkillResponse;
    export type ISkillReference = _ISkillReference;
  }

  export namespace POSTSkill {
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

  export namespace GETSkills {
    export namespace Response {
      export type SkillItem = ISkillResponse;
      export type Payload = PaginatedSkillResponse;
    }
    export namespace Request {
      export namespace Param {
        export type Payload = ISkillParam;
      }
      export namespace Query {
        export type Payload = ISkillQueryParams;
      }
    }
  }

  export namespace PUTSkill {
    export namespace Request {
      export type Payload = ISkillRequest;
    }
    export namespace Response {
      export type Payload = ISkillResponse;
    }
  }

  export namespace Detail {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = 0;
    export namespace PUT {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = 0;
      export namespace Request {
        export type Payload = ISkillRequest;
      }
      export namespace Response {
        export type Payload = ISkillResponse;
      }
    }
    export namespace PATCH {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = 0;
      export namespace Request {
        export type Payload = Partial<ISkillRequest>;
      }
      export namespace Response {
        export type Payload = ISkillResponse;
      }
    }
    export namespace GET {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = 0;
      export namespace Request {
        export namespace Param {
          export type Payload = ISkillDetailParam;
        }
      }
      export namespace Response {
        export type Payload = ISkillResponse;
      }
    }
    export namespace Parents {
      export namespace GET {
        export namespace Response {
          export type ParentItem = ISkillParentItem;
          export type Payload = ISkillParentsResponse;
        }
        export namespace Request {
          export namespace Query {
            export type Payload = ISkillParentsRequestQuery;
          }
        }
      }
    }
    export namespace Children {
      export namespace GET {
        export namespace Response {
          export type Payload = ISkillChildrenResponse;
        }
        export namespace Request {
          export namespace Query {
            export type Payload = ISkillChildrenRequestQuery;
          }
        }
      }
    }
    export namespace Occupations {
      export namespace GET {
        export namespace Response {
          export type Payload = ISkillOccupationsResponse;
        }
        export namespace Request {
          export namespace Query {
            export type Payload = ISkillOccupationsRequestQuery;
          }
        }
      }
    }
    export namespace RelatedSkills {
      export namespace GET {
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

    export namespace History {
      export namespace GET {
        export namespace Response {
          export type HistoryItem = ISkillHistoryItem;
          export type Payload = ISkillHistoryItem[];
        }
      }
    }
  }
}

export default SkillTypes;
