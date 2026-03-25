import OccupationGroupEnums from "./enums";

export interface IOccupationGroupResponse {
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

export interface IOccupationGroupChildResponse {
  id: string;
  parentId: string;
  UUID: string;
  originUUID: string;
  path: string;
  tabiyaPath: string;
  UUIDHistory: string[];
  originUri: string;
  code: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  objectType: OccupationGroupEnums.Relations.Children.ObjectTypes;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOccupationGroupResponse {
  data: IOccupationGroupResponse[];
  limit: number;
  nextCursor: string | null;
}

export interface PaginatedOccupationGroupChildrenResponse {
  data: IOccupationGroupChildResponse[];
  limit: number | null;
  nextCursor: string | null;
}

export interface IOccupationGroupRequest {
  originUri: string;
  groupType: OccupationGroupEnums.ObjectTypes.ISCOGroup | OccupationGroupEnums.ObjectTypes.LocalGroup;
  code: string;
  description: string;
  preferredLabel: string;
  altLabels: string[];
  modelId: string;
  UUIDHistory: string[];
}

export interface IOccupationGroupParam {
  modelId: string;
}

export interface IOccupationGroupDetailParam {
  modelId: string;
  id: string;
}

export interface IOccupationGroupQueryParams {
  limit?: number;
  cursor?: string;
}

namespace OccupationGroupTypes {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = 0;
  export namespace Response {
    export type IOccupationGroup = IOccupationGroupResponse;
  }
}

export default OccupationGroupTypes;
