import {
  Occupation,
  OccupationGroup,
  Skill,
  SkillGroup,
  OccupationHierarchy,
  OccupationToSKillRelation,
  SkillToSkillRelation,
  SkillHierarchy,
  ModelInfo,
} from "scripts/modelDiff/esco/types";
import { MemoryStatus } from "./types";

/**
 * Represents the state of a model, which includes model-specific details,
 * associated entities, and relations.
 */
export class ModelState {
  modelPath: string;
  modelInfo: ModelInfo | null;
  memoryStatus: MemoryStatus;

  occupations: Occupation[];
  skills: Skill[];
  skillGroups: SkillGroup[];
  occupationGroups: OccupationGroup[];

  occupationToSkill: OccupationToSKillRelation[];
  occupationHierarchy: OccupationHierarchy[];
  skillHierarchy: SkillHierarchy[];
  skillToSkill: SkillToSkillRelation[];

  constructor(modelPath: string) {
    // On initialization, we generate a random UUID for the model ID.
    // This ensures that each model instance has a unique identifier.
    // We also set the model entities and relations to empty arrays.

    this.modelPath = modelPath;
    this.modelInfo = null;

    this.memoryStatus = MemoryStatus.INITIALIZED;

    this.occupations = [];
    this.skills = [];
    this.skillGroups = [];
    this.occupationGroups = [];

    this.occupationToSkill = [];
    this.occupationHierarchy = [];
    this.skillHierarchy = [];
    this.skillToSkill = [];
  }

  get modelName(): string {
    return this.modelInfo?.name + " " + this.modelInfo?.version;
  }
}
