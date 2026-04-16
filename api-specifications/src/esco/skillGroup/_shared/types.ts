import SkillGroupEnums from "./enums";

export interface ISkillGroupResponse {
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
    objectType: SkillGroupEnums.Relations.Parents.ObjectTypes.SkillGroup;
  }[];
  children: {
    id: string;
    UUID: string;
    preferredLabel: string;
    objectType:
      | SkillGroupEnums.Relations.Children.ObjectTypes.Skill
      | SkillGroupEnums.Relations.Children.ObjectTypes.SkillGroup;
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

export interface ISkillGroupChildResponse {
  id: string;
  parentId: string;
  UUID: string;
  originUUID: string;
  path: string;
  tabiyaPath: string;
  UUIDHistory: string[];
  originUri: string;
  code?: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  objectType: SkillGroupEnums.Relations.Children.ObjectTypes;
  isLocalized?: boolean;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSkillGroupChildrenResponse {
  data: ISkillGroupChildResponse[];
  limit: number | null;
  nextCursor: string | null;
}

export interface PaginatedSkillGroupResponse {
  data: ISkillGroupResponse[];
  limit: number;
  nextCursor: string | null;
}

export interface PaginatedSkillGroupParentsResponse {
  data: ISkillGroupResponse[];
  limit: number | null;
  nextCursor: string | null;
}

export interface ISkillGroupRequest {
  UUIDHistory: string[];
  originUri: string;
  code: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  scopeNote: string;
  modelId: string;
}

export interface ISkillGroupParam {
  modelId: string;
}

export interface ISkillGroupDetailParam {
  modelId: string;
  id: string;
}

export interface ISkillGroupQueryParams {
  limit?: number;
  cursor?: string;
}

export interface ISkillGroupParentsRequestQuery {
  limit?: number;
  cursor?: string;
}

export interface ISkillGroupChildrenRequestQuery {
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
      export namespace Param {
        export type Payload = ISkillGroupParam;
      }
    }
  }

  export namespace GET {
    export namespace Response {
      export type SkillGroupItem = ISkillGroupResponse;
      export type Payload = PaginatedSkillGroupResponse;
      export namespace Parent {
        export type Payload = ISkillGroupResponse;
      }
      export namespace Parents {
        export type Payload = PaginatedSkillGroupParentsResponse;
      }
      export namespace Child {
        export type Payload = ISkillGroupChildResponse;
      }
      export namespace Children {
        export type Payload = PaginatedSkillGroupChildrenResponse;
      }
      export namespace ById {
        export type Payload = ISkillGroupResponse;
      }
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
    export namespace Parents {
      export namespace Request {
        export namespace Query {
          export type Payload = ISkillGroupParentsRequestQuery;
        }
      }
    }
    export namespace Children {
      export namespace Request {
        export namespace Query {
          export type Payload = ISkillGroupChildrenRequestQuery;
        }
      }
    }
  }
}

export default SkillGroupTypes;
