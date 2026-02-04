// This interface represents an occupation with relationship metadata
export interface ISkillOccupationItem {
  // Occupation properties
  id: string;
  UUID: string;
  code: string;
  preferredLabel: string;
  occupationType: "ESCOOccupation" | "LocalOccupation";

  // Relationship metadata from OccupationToSkillRelation
  relationType: "essential" | "optional" | null;
  signallingValue: number | null;
  signallingValueLabel: string | null;
}

export interface ISkillOccupationsResponse {
  data: ISkillOccupationItem[];
  limit: number;
  nextCursor: string | null;
}

export interface ISkillOccupationsRequestQuery {
  limit?: number;
  cursor?: string;
}
