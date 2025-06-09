import { Occupation, OccupationGroup, Skill, SkillGroup } from "scripts/modelDiff/esco/types";
import { randomUUID } from "crypto";
import { MemoryStatus } from "./types";
import {
  IOccupationHierarchyImportRow,
  IOccupationToSkillRelationImportRow,
  ISkillHierarchyImportRow,
  ISkillToSkillsRelationImportRow,
} from "esco/common/entityToCSV.types";
import { IModelInfoDoc } from "modelInfo/modelInfo.types";

/**
 * Represents the state of a model, which includes model-specific details,
 * associated entities, and relations.
 */
export class ModelState {
  modelId: string;
  modelPath: string;
  modelInfo: IModelInfoDoc | null;

  memoryStatus: MemoryStatus;

  occupations: Occupation[];
  skills: Skill[];
  skillGroups: SkillGroup[];
  occupationGroups: OccupationGroup[];

  occupationToSkill: IOccupationToSkillRelationImportRow[];
  occupationHierarchy: IOccupationHierarchyImportRow[];
  skillHierarchy: ISkillHierarchyImportRow[];
  skillToSkill: ISkillToSkillsRelationImportRow[];

  constructor(modelPath: string) {
    // On initialization, we generate a random UUID for the model ID.
    // This ensures that each model instance has a unique identifier.
    // We also set the model entities and relations to empty arrays.

    this.modelId = randomUUID();
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

  getModelName(): string {
    return this.modelInfo?.name + " " + this.modelInfo?.version;
  }
}
