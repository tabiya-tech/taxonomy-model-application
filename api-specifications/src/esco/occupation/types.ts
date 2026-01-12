import OccupationEnums from "./enums";
import SkillTypes from "../skill/types";
import OccupationGroupTypes from "../occupationGroup/types";

interface IOccupationParent {
  id: string;
  UUID: string;
  code: string;
  preferredLabel: string;
  objectType: OccupationEnums.Relations.Parent.ObjectTypes;
}

interface IOccupationChild {
  id: string;
  UUID: string;
  code: string;
  preferredLabel: string;
  objectType: OccupationEnums.Relations.Children.ObjectTypes;
}

interface IOccupationRequiredSkill {
  id: string;
  UUID: string;
  preferredLabel: string;
  isLocalized: boolean;
  objectType: OccupationEnums.Relations.RequiredSkills.ObjectTypes;
  relationType: OccupationEnums.OccupationToSkillRelationType | null;
  signallingValue: number | null;
  signallingValueLabel: string | null;
}

interface IOccupationResponse {
  id: string;
  UUID: string;
  UUIDHistory: string[];
  originUUID: string;
  path: string;
  tabiyaPath: string;
  code: string;
  occupationGroupCode: string;
  preferredLabel: string;
  originUri: string;
  altLabels: string[];
  definition: string;
  description: string;
  regulatedProfessionNote: string;
  scopeNote: string;
  occupationType: OccupationEnums.OccupationType;
  modelId: string;
  isLocalized: boolean;
  parent: IOccupationParent | null;
  children: IOccupationChild[];
  requiresSkills: IOccupationRequiredSkill[];
  createdAt: string;
  updatedAt: string;
}

interface IOccupationRequest {
  code: string;
  occupationGroupCode: string;
  preferredLabel: string;
  originUri: string;
  altLabels: string[];
  definition: string;
  description: string;
  regulatedProfessionNote: string;
  scopeNote: string;
  occupationType: OccupationEnums.OccupationType;
  modelId: string;
  UUIDHistory: string[];
  isLocalized: boolean;
}

interface PaginatedOccupationResponse {
  data: IOccupationResponse[];
  limit: number;
  nextCursor: string | null;
}

interface PaginatedOccupationChildrenResponse {
  data: IOccupationChild[];
  limit: number;
  nextCursor: string | null;
}

// Skill with occupation-to-skill relationship metadata
interface IOccupationSkill extends SkillTypes.Response.ISkill {
  relationType: OccupationEnums.OccupationToSkillRelationType | null;
  signallingValue: number | null;
  signallingValueLabel: string | null;
}

interface PaginatedOccupationSkillsResponse {
  data: IOccupationSkill[];
  limit: number;
  nextCursor: string | null;
}

interface IOccupationParam {
  modelId: string;
}

interface IOccupationDetailParam {
  modelId: string;
  id: string;
}

interface IOccupationQueryParams {
  limit?: number;
  cursor?: string;
}

namespace OccupationTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;

  export namespace Response {
    export type IOccupation = IOccupationResponse;
    export type RequiresSkillItem = IOccupationRequiredSkill;
  }

  export namespace POST {
    export namespace Request {
      export type Payload = IOccupationRequest;
    }
    export namespace Response {
      export type Payload = IOccupationResponse;
    }
  }

  export namespace GET {
    export namespace Response {
      export type OccupationItem = IOccupationResponse;
      export type Payload = PaginatedOccupationResponse;
    }
    export namespace Parent {
      export namespace Response {
        export type Payload = IOccupationResponse | OccupationGroupTypes.Response.IOccupationGroup | null;
      }
    }
    export namespace Children {
      export namespace Response {
        export type ChildItem = IOccupationChild;
        export type Payload = PaginatedOccupationChildrenResponse;
      }
      export namespace Request {
        export namespace Query {
          export type Payload = IOccupationQueryParams;
        }
      }
    }
    export namespace Skills {
      export namespace Response {
        export type SkillItem = IOccupationSkill;
        export type Payload = PaginatedOccupationSkillsResponse;
      }
      export namespace Request {
        export namespace Query {
          export type Payload = IOccupationQueryParams;
        }
      }
    }
    export namespace Request {
      export namespace Param {
        export type Payload = IOccupationParam;
      }
      export namespace Query {
        export type Payload = IOccupationQueryParams;
      }
      export namespace Detail {
        export namespace Param {
          export type Payload = IOccupationDetailParam;
        }
      }
    }
  }
}

export default OccupationTypes;
