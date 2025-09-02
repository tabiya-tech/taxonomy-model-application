import OccupationGroupEnums from "./enums";

interface IOccupationGroupResponse {
  id: string;
  UUID: string;
  path: string;
  tabiyaPath: string;
  parent: {
    id: string;
    UUID: string;
    code: string;
    preferredLabel: string;
    objectType: OccupationGroupEnums.ENUMS.ObjectTypes.ISCOGroup | OccupationGroupEnums.ENUMS.ObjectTypes.LocalGroup;
  };
  children: {
    id: string;
    UUID: string;
    code: string;
    preferredLabel: string;
    objectType:
      | OccupationGroupEnums.ENUMS.ObjectTypes.ISCOGroup
      | OccupationGroupEnums.ENUMS.ObjectTypes.LocalGroup
      | OccupationGroupEnums.ENUMS.ObjectTypes.ESCOOccupation
      | OccupationGroupEnums.ENUMS.ObjectTypes.LocalOccupation;
  }[];
  originUri: string;
  code: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  importId: string;
  groupType: OccupationGroupEnums.ENUMS.ObjectTypes.ISCOGroup | OccupationGroupEnums.ENUMS.ObjectTypes.LocalGroup;
  modelId: string;
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
