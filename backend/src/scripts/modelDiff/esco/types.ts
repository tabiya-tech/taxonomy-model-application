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

export type RecordType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

/** ======================================================
 *                     Entities (Types)
 ======================================================= */

export type ComparableEntity<T> = {
  row: T;
  UUIDHistory: string[];
  recentUUID: string;
  originUUID: string;
  altLabels: string[];
};

export type Occupation = ComparableEntity<IOccupationImportRow>;

export type OccupationGroup = ComparableEntity<IOccupationGroupImportRow>;

export type Skill = ComparableEntity<ISkillImportRow>;

export type SkillGroup = ComparableEntity<ISkillGroupImportRow>;

export type Entity = Skill | Occupation | SkillGroup | OccupationGroup;

/** ======================================================
 *                     Rlations (Types)
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
 *                     SERVICES (Interfaces)
  ======================================================= */

export class ESCOCollectionService {
  constructor(public modelManager: IModelManager) {}

  /**
   * Loads data from a CSV file and processes it.
   *
   * @return {Promise<void>} A promise that resolves when the CSV data has been successfully loaded and processed.
   */
  loadFromCSV(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export class ESCOEntityService extends ESCOCollectionService {}

export class ESCORelationService extends ESCOCollectionService {
  loadOriginUUIDs(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
