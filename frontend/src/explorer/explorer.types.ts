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
