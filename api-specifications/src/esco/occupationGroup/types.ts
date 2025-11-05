import OccupationGroupEnums from "./enums";

interface IOccupationGroupResponse {
  id: string;
  UUID: string;
  UUIDHistory: string[];
  originUUID: string;
  path: string;
  tabiyaPath: string;
  parent: {
    id: string;
    UUID: string;
    code: string;
    preferredLabel: string;
    objectType:
      | OccupationGroupEnums.Relations.Parent.ObjectTypes.ISCOGroup
      | OccupationGroupEnums.Relations.Parent.ObjectTypes.LocalGroup;
  } | null;
  children: {
    id: string;
    UUID: string;
    code: string;
    preferredLabel: string;
    objectType: OccupationGroupEnums.Relations.Children.ObjectTypes;
  }[];
  originUri: string;
  code: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  groupType: OccupationGroupEnums.ObjectTypes.ISCOGroup | OccupationGroupEnums.ObjectTypes.LocalGroup;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedOccupationGroupResponse {
  data: IOccupationGroupResponse[];
  limit: number;
  nextCursor: string | null;
}

interface IOccupationGroupRequest {
  originUri: string;
  groupType: OccupationGroupEnums.ObjectTypes.ISCOGroup | OccupationGroupEnums.ObjectTypes.LocalGroup;
  code: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  modelId: string;
  UUIDHistory: string[];
}

interface IOccupationGroupParam {
  modelId: string;
}

interface IOccupationGroupDetailParam {
  modelId: string;
  id: string;
}

interface IOccupationGroupQueryParams {
  limit?: number;
  cursor?: string;
}

namespace OccupationGroupTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type IOccupationGroup = IOccupationGroupResponse;
  }

  export namespace POST {
    export namespace Response {
      export type Payload = IOccupationGroupResponse;
    }

    export namespace Request {
      export type Payload = IOccupationGroupRequest;
    }
  }

  export namespace GET {
    export namespace Response {
      export type OccupationGroupItem = IOccupationGroupResponse;
      export type Payload = PaginatedOccupationGroupResponse;
    }
    export namespace Request {
      export namespace Param {
        export type Payload = IOccupationGroupParam;
      }
      export namespace Query {
        export type Payload = IOccupationGroupQueryParams;
      }
      export namespace Detail {
        export namespace Param {
          export type Payload = IOccupationGroupDetailParam;
        }
      }
    }
  }
}

export default OccupationGroupTypes;
