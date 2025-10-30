import SkillGroupEnums from "./enums";

interface ISkillGroupResponse {
  id: string;
  UUID: string;
  UUIDHistory: string[];
  originUUID: string;
  path: string;
  tabiyaPath: string;
  parents: {
    id: string;
    UUID: string;
    code: string;
    preferredLabel: string;
    objectType: SkillGroupEnums.ObjectTypes.SkillGroup;
  }[];
  children: {
    id: string;
    UUID: string;
    preferredLabel: string;
    objectType: SkillGroupEnums.ObjectTypes;
    code?: string;
    isLocalized?: boolean;
  }[];
  originUri: string;
  code: string;
  description: string;
  scopeNote: string;
  preferredLabel: string;
  altLabels: string[];
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedSkillGroupResponse {
  data: ISkillGroupResponse[];
  limit: number;
  nextCursor: string | null;
}

interface ISkillGroupRequest {
  UUIDHistory: string[];
  originUri: string;
  code: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  scopeNote: string;
  modelId: string;
}

interface ISkillGroupParam {
  modelId: string;
}

interface ISkillGroupDetailParam {
  modelId: string;
  id: string;
}

interface ISkillGroupQueryParams {
  limit?: number;
  cursor?: string;
}

namespace SkillGroupTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type ISkillGroup = ISkillGroupResponse;
  }
  export namespace POST {
    export namespace Response {
      export type Payload = ISkillGroupResponse;
    }
    export namespace Request {
      export type Payload = ISkillGroupRequest;
    }
  }

  export namespace GET {
    export namespace Response {
      export type SkillGroupItem = ISkillGroupResponse;
      export type Payload = PaginatedSkillGroupResponse;
    }

    export namespace Request {
      export namespace Param {
        export type Payload = ISkillGroupParam;
      }
      export namespace Query {
        export type Payload = ISkillGroupQueryParams;
      }
      export namespace Detail {
        export namespace Param {
          export type Payload = ISkillGroupDetailParam;
        }
      }
    }
  }
}

export default SkillGroupTypes;
