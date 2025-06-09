import { ModelState } from "./state";
import {
  IOccupationHierarchyImportRow,
  IOccupationToSkillRelationImportRow,
  ISkillHierarchyImportRow,
} from "esco/common/entityToCSV.types";
import { Occupation, OccupationGroup, Skill, SkillGroup } from "scripts/modelDiff/esco/types";

export enum MemoryStatus {
  INITIALIZED = "INITIALIZED",
  MODEL_INFO_LOADED = "MODEL_INFO_LOADED",
  LOADED = "LOADED",
}

export type Caches = {
  occupations: Map<string, Occupation>;
  skills: Map<string, Skill>;
  skillGroups: Map<string, SkillGroup>;
  occupationGroups: Map<string, OccupationGroup>;
};

export interface IModelManager {
  state: ModelState;
  caches: Caches;

  /**
   * Clear the caches.
   */
  clearCaches(): void;

  /**
   * Load the model info from the model path.
   *
   * — Update the logger,
   * — and load the model details.
   */
  loadModelInfo(): Promise<void>;

  /**
   * Load the model Entities and relations.
   * Construct the model entities and relations from the CSV files.
   */
  load(): Promise<void>;

  getSkillById(id: string): Skill | undefined;

  getOccupationToSKillsRelationsByOccupationId(id: string): IOccupationToSkillRelationImportRow[];

  getOccupationToSKillsRelationsBySkillId(id: string): IOccupationToSkillRelationImportRow[];

  getOccupationGroupById(id: string): OccupationGroup | undefined;

  getOccupationById(id: string): Occupation | undefined;

  getOccupationChildrenByOccupationId(id: string): IOccupationHierarchyImportRow[];

  getOccupationParentByOccupationId(id: string): IOccupationHierarchyImportRow[];

  getSkillParentBySkillId(id: string): ISkillHierarchyImportRow[];

  getSkillGroupById(id: string): SkillGroup | undefined;

  getSkillChildrenBySkillId(ID: string): ISkillHierarchyImportRow[];

  getSKillByOriginalUUID(originalUUID: string): Skill | undefined;

  getOccupationByOriginalUUID(originalUUID: string): Occupation | undefined;

  getSkillGroupByOriginalUUID(originalUUID: string): SkillGroup | undefined;

  getOccupationGroupByOriginalUUID(originalUUID: string): OccupationGroup | undefined;
}
