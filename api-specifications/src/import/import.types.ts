export type  ImportFilePaths = { [key in ImportFileTypes]?: string }

export interface ImportRequest {
  modelId: string
  filePaths: ImportFilePaths
}

export enum ImportResponseErrorCodes {
  FAILED_TO_TRIGGER_IMPORT = "FAILED_TO_TRIGGER_IMPORT"
}

export enum ImportFileTypes {
  ESCO_OCCUPATION = "ESCO_OCCUPATION", // <--- occupations_en.csv
  ESCO_SKILL_HIERARCHY = "ESCO_SKILL_HIERARCHY", // <--- broaderRelationsSkillPillar.csv
  ESCO_SKILL_GROUP = "ESCO_SKILL_GROUP", // <-- skillGroups_en.csv
  ESCO_SKILL = "ESCO_SKILL", //<--- skills_en.csv
  ESCO_SKILL_SKILL_RELATIONS = "ESCO_SKILL_SKILL_RELATIONS", // <--- skillSkillRelations.csv
  ISCO_GROUP = "ISCO_GROUP", //<--- ISCOGroups_en.csv
  LOCAL_OCCUPATION = "LOCAL_OCCUPATION",
  LOCALIZED_OCCUPATION = "LOCALIZED_OCCUPATION",
  MODEL_INFO = "MODEL_INFO",
  OCCUPATION_HIERARCHY = "OCCUPATION_HIERARCHY", // <--- broaderRelationsOccPillar.csv
  OCCUPATION_LOGS = "OCCUPATION_LOGS",
  OCCUPATION_LOG_CHANGES = "OCCUPATION_LOG_CHANGES",
  OCCUPATION_SKILL_RELATION = "OCCUPATION_SKILL_RELATION" // <--- occupationSkillRelations.csv
}