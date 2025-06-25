import {
  IOccupationGroupImportRow,
  IOccupationHierarchyImportRow,
  IOccupationImportRow,
  IOccupationToSkillRelationImportRow,
  ISkillGroupImportRow,
  ISkillHierarchyImportRow,
  ISkillImportRow,
  ISkillToSkillsRelationImportRow,
} from "esco/common/entityToCSV.types";

import { IModelManager } from "scripts/modelDiff/model/types";

export type CSVFileRecordType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Represents a generic record type for CSV files
};

/** ======================================================
 *                     Entities (Types)
 ======================================================= */

/**
 * Parsed UUID history information
 */
export type UUIDHistoryParsed = {
  /** Complete history of UUIDs as an array */
  UUIDHistory: string[];

  /** Most recent UUID (first in history) */
  recentUUID: string;

  /** Origin UUID (last in history) */
  originUUID: string;
};

export type ComparableEntity<T> = UUIDHistoryParsed & { row: T };

export type Occupation = ComparableEntity<IOccupationImportRow>;

export type OccupationGroup = ComparableEntity<IOccupationGroupImportRow>;

export type Skill = ComparableEntity<ISkillImportRow>;

export type SkillGroup = ComparableEntity<ISkillGroupImportRow>;

export type Entity = Skill | Occupation | SkillGroup | OccupationGroup;

/** ======================================================
 *                     Associations (Types)
 ======================================================= */

export type OccupationHierarchy = IOccupationHierarchyImportRow & {
  parentOriginUUID?: string;
  childOriginUUID?: string;
};

export type OccupationToSKillRelation = IOccupationToSkillRelationImportRow & {
  occupationOriginUUID?: string;
  skillOriginUUID?: string;
};

export type SkillHierarchy = ISkillHierarchyImportRow & {
  parentOriginUUID?: string;
  childOriginUUID?: string;
};

export type SkillToSkillRelation = ISkillToSkillsRelationImportRow & {
  requiredSkillOriginUUID?: string;
  requiringSkillOriginUUID?: string;
};

export type Relation = OccupationHierarchy | OccupationToSKillRelation | SkillHierarchy | SkillToSkillRelation;

/** ======================================================
 *                     Model Info (Types)
 ======================================================= */

export type ModelInfo = {
  name: string;
  version: string;
};

/** ======================================================
 *                     SERVICES (Interfaces)
  ======================================================= */

export abstract class TaxonomyCollectionService {
  constructor(public modelManager: IModelManager) {}

  /**
   * Loads data from a CSV into the model manager.
   *
   * @return {Promise<void>} A promise that resolves when the CSV data has been successfully loaded.
   */
  loadFromCSV(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export class TaxonomyEntityService extends TaxonomyCollectionService {}

export class TaxonomyRelationService extends TaxonomyCollectionService {}
