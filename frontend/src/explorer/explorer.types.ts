export enum ObjectType {
  ISCOGroup = "iscogroup",
  LocalGroup = "localgroup",
  ESCOOccupation = "escooccupation",
  LocalOccupation = "localoccupation",
  Skill = "skill",
  SkillGroup = "skillgroup",
}

export type ExplorerRelatedSkill = {
  id: string;
  preferredLabel: string;
  code?: string;
  relationType?: string | null;
};

export type ExplorerRelatedOccupation = {
  id: string;
  preferredLabel: string;
  code?: string;
  relationType?: string | null;
};

export type ExplorerContainedItem = {
  id: string;
  code: string;
  title: string;
};

export type ExplorerHistoryModel = {
  id: string | null;
  UUID: string;
  name: string | null;
  version: string | null;
  localeShortCode: string | null;
};

export type ExplorerHistoryItem = {
  id: string;
  model: ExplorerHistoryModel;
  preferredLabel: string;
};

export type ExplorerItemDetail = {
  id: string;
  UUID: string;
  definition: string;
  altLabels: string[];
  objectType: ObjectType;
  code?: string;
  occupationType?: string;
  occupationGroupCode?: string;
  regulatedProfessionNote?: string;
  skillType?: string;
  reuseLevel?: string;
  contains?: ExplorerContainedItem[];
  requiresSkills?: ExplorerRelatedSkill[];
  requiredByOccupations?: ExplorerRelatedOccupation[];
};
