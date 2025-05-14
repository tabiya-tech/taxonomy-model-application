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
import { IModelInfoDoc } from "../../modelInfo/modelInfo.types";

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

export type CSVEntities = {
  occupations: Occupation[];
  skills: Skill[];
  skillGroups: SkillGroup[];
  occupationGroups: OccupationGroup[];
};

export type CSVRelations = {
  occupationToSkill: IOccupationToSkillRelationImportRow[];
  occupationHierarchy: IOccupationHierarchyImportRow[];
  skillHierarchy: ISkillHierarchyImportRow[];
  skillToSkill: ISkillToSkillsRelationImportRow[];
};

export type Caches = {
  occupations: Map<string, Occupation>;
  skills: Map<string, Skill>;
  skillGroups: Map<string, SkillGroup>;
  occupationGroups: Map<string, OccupationGroup>;
};

export enum ModelStatus {
  INITIALIZED = "INITIALIZED",
  MODEL_INFO_LOADED = "MODEL_INFO_LOADED",
  LOADED = "LOADED",
}

export interface IModel {
  _modelId: string;
  _modelPath: string;
  _status: ModelStatus;
  _csvEntities: CSVEntities;
  _csvRelations: CSVRelations;
  _caches: Caches;
  _modelInfo: IModelInfoDoc | null;

  /**
   * Update state: Set the model skills
   *
   * @param skills - Skill Entities.
   */
  setSkills(skills: Skill[]): void;

  /**
   * Update state: Set the model occupations
   *
   * @param occupations
   */
  setOccupations(occupations: Occupation[]): void;

  /**
   * Update state: Set the model skill groups
   *
   * @param skillGroups
   */
  setSkillGroups(skillGroups: SkillGroup[]): void;

  /**
   * Update state: Set the model occupation groups
   *
   * @param occupationGroups
   */
  setOccupationGroups(occupationGroups: OccupationGroup[]): void;

  /**
   * Update state: Set the model occupation to skill relations
   *
   * @param occupationToSkill
   */
  setOccupationToSkill(occupationToSkill: IOccupationToSkillRelationImportRow[]): void;

  /**
   * Update state: Set the model occupation hierarchy
   *
   * @param occupationHierarchy
   */
  setOccupationHierarchy(occupationHierarchy: IOccupationHierarchyImportRow[]): void;

  /**
   * Update state: Set the model skill to skill relations
   *
   * @param skillHierarchy
   */
  setSkillHierarchy(skillHierarchy: ISkillHierarchyImportRow[]): void;

  setSkillToSkill(skillToSkill: ISkillToSkillsRelationImportRow[]): void;

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
