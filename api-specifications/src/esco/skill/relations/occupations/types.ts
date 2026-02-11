import SkillEnums from "../../enums";

// This interface represents an occupation with relationship metadata
export interface ISkillOccupationItem {
  // Occupation properties
  id: string;
  UUID: string;
  code: string;
  preferredLabel: string;
  occupationType: SkillEnums.OccupationObjectTypes;

  // Relationship metadata from OccupationToSkillRelation
  relationType: SkillEnums.OccupationToSkillRelationType | null;
  signallingValue: number | null;
  signallingValueLabel: SkillEnums.SignallingValueLabel | null;
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
