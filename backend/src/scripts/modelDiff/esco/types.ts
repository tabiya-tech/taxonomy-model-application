import {
  IOccupationGroupImportRow,
  IOccupationImportRow,
  ISkillGroupImportRow,
  ISkillImportRow,
} from "esco/common/entityToCSV.types";

import { IModelManager } from "scripts/modelDiff/model/types";
import { ArrayChange, Change as WordsChange } from "diff";

export type RecordType = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type ComparableEntity<T> = {
  row: T;
  UUIDHistory: string[];
  recentUUID: string;
  originalUUID: string;
  altLabels: string[];
};

export type Occupation = ComparableEntity<IOccupationImportRow> & {
  skills: string[];

  parents: string[];
  children: string[];
};

export type OccupationGroup = ComparableEntity<IOccupationGroupImportRow> & {
  parents: string[];
  children: string[];
};

export type Skill = ComparableEntity<ISkillImportRow> & {
  occupations: string[];
  parents: string[];
  children: string[];
};

export type SkillGroup = ComparableEntity<ISkillGroupImportRow> & {
  parents: string[];
  children: string[];
};

export type Entity = Skill | Occupation | SkillGroup | OccupationGroup;

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

export class ESCOEntityService extends ESCOCollectionService {
  /**
   * Loads the relations of entities on the entity itself instead of by reference.
   */
  loadRelations() {
    throw new Error("Method not implemented.");
  }
}

export class ESCORelationService extends ESCOCollectionService {}

export enum ChangeType {
  MISSING = "missing",
  NOT_EQUAL = "not-equal",
}

export type Change = {
  type: ChangeType;
  label?: string;
  entityType: "skill" | "occupation" | "skillGroup" | "occupationGroup";
  identifier: string;
  entity: string;
  modelId: string;
  modelName: string;
  entityLabel: string;
  changes?: WordsChange[] | ArrayChange<string>[];
};
