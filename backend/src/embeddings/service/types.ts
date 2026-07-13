export enum EmbeddableEntityType {
  Skill = "Skill",
  Occupation = "Occupation",
  OccupationGroup = "OccupationGroup",
  SkillGroup = "SkillGroup",
}

export enum EmbeddableField {
  preferredLabel = "preferredLabel",
  description = "description",
  altLabels = "altLabels",
  scopeNote = "scopeNote",
}

export interface IGenerateEmbeddingTask {
  modelId: string;
  entityId: string;
  entityType: EmbeddableEntityType;
  fields: EmbeddableField[];
}
