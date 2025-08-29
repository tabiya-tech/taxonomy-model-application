import OccupationGroupEnums from "./enums";

interface IOccupationGroupResponse {
  id: string;
  UUID: string;
  path: string;
  tabiyaPath: string;
  originUri: string;
  code: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  groupType: OccupationGroupEnums.ENUMS.GroupType.ISCOGroup | OccupationGroupEnums.ENUMS.GroupType.LocalGroup;
  importId: string;
  modelId: {
    id: string | null;
    UUID: string;
    name: string | null;
    localeShortCode: string | null;
    version: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface IOccupationGroupRequest {
  originUri: string;
  code: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  importId: string;
  modelId: string;
  UUIDHistory: string[];
}

namespace OccupationGroupTypes {
  // This is here to make sure the namespace is not empty and the:
  //    "Cannot use 'export import' on a type or type-only namespace when the '--isolatedModules' flag is provided"
  // error is not thrown.
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
      export type Payload = OccupationGroupItem[];
    }
  }
}

export default OccupationGroupTypes;
