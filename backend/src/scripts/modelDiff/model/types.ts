import { ModelState } from "./state";
import {
  Occupation,
  OccupationGroup,
  OccupationHierarchy,
  OccupationToSKillRelation,
  Skill,
  SkillGroup,
  SkillHierarchy,
  SkillToSkillRelation,
} from "scripts/modelDiff/esco/types";
import { Logger } from "scripts/modelDiff/logger";

export enum MemoryStatus {
  INITIALIZED = "INITIALIZED",
  MODEL_INFO_LOADED = "MODEL_INFO_LOADED",
  LOADED = "LOADED",
}

export type Caches = {
  // Entities.
  occupations: {
    UUIDS: Map<string, Occupation | undefined>;
    IDS: Map<string, Occupation | undefined>;
  };
  skills: {
    UUIDS: Map<string, Skill | undefined>;
    IDS: Map<string, Skill | undefined>;
  };
  skillGroups: {
    UUIDS: Map<string, SkillGroup | undefined>;
    IDS: Map<string, SkillGroup | undefined>;
  };
  occupationGroups: {
    UUIDS: Map<string, OccupationGroup | undefined>;
    IDS: Map<string, OccupationGroup | undefined>;
  };
};

export interface IModelManager {
  state: ModelState;
  caches: Caches;
  logger: Logger;

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

  getOccupationGroupById(id: string): OccupationGroup | undefined;

  getOccupationById(id: string): Occupation | undefined;

  getSkillGroupById(id: string): SkillGroup | undefined;

  getSKillByOriginUUID(originUUID: string): Skill | undefined;

  getOccupationByOriginUUID(originUUID: string): Occupation | undefined;

  getSkillGroupByOriginUUID(originUUID: string): SkillGroup | undefined;

  getOccupationGroupByOriginUUID(originUUID: string): OccupationGroup | undefined;

  getSkillToSkillRelationByOriginUUIDs(
    requiredSkillOriginUUID: string,
    requiringSkillOriginUUID: string
  ): SkillToSkillRelation | undefined;

  getSKillHierarchy(row: SkillHierarchy): SkillHierarchy | undefined;

  getOccupationHierarchy(relation: OccupationHierarchy): OccupationHierarchy | undefined;

  getOccupationToSkillRelationByOriginUUIDs(
    occupationOriginUUID: string,
    skillOriginUUID: string
  ): OccupationToSKillRelation | undefined;
}
