import type { IModelInfoRow } from "export/modelInfo/modelInfoToCSVTransform";

import { Caches, IModelManager, MemoryStatus } from "./types";
import { ModelState } from "./state";
import {
  TaxonomyCollectionService,
  TaxonomyRelationService,
  OccupationHierarchy,
  OccupationToSKillRelation,
  SkillHierarchy,
} from "scripts/modelDiff/esco/types";
import { transformModelInfo } from "scripts/modelDiff/esco/modelInfo";
import { SkillsService } from "scripts/modelDiff/esco/skills";
import { SkillGroupsService } from "scripts/modelDiff/esco/skillGroups";
import { OccupationService } from "scripts/modelDiff/esco/occupations";
import { OccupationGroupsService } from "scripts/modelDiff/esco/occupationGroups";
import { SkillToSkillService } from "scripts/modelDiff/esco/skillToSkill";
import { OccupationToSkillRelationService } from "scripts/modelDiff/esco/occupationToSkill";
import { OccupationHierarchyService } from "scripts/modelDiff/esco/occupationHierarcy";
import { SkillHierarchyService } from "scripts/modelDiff/esco/skillHierarchy";
import { readCSV } from "scripts/modelDiff/esco/common";
import { Logger, createLogger } from "scripts/modelDiff/logger";

export class ModelManager implements IModelManager {
  /**
   * The model Details in the state.
   */
  state: ModelState;

  logger: Logger;

  /**
   * The model caches. Used to memoize the searches.
   */
  caches: Caches;

  constructor(modelPath: string) {
    this.logger = createLogger("ModelManager");

    this.logger.info("Setting up the model");

    this.state = new ModelState(modelPath);

    this.caches = {
      occupations: {
        UUIDS: new Map(),
        IDS: new Map(),
      },
      skills: {
        UUIDS: new Map(),
        IDS: new Map(),
      },
      skillGroups: {
        UUIDS: new Map(),
        IDS: new Map(),
      },
      occupationGroups: {
        UUIDS: new Map(),
        IDS: new Map(),
      },
    };
  }

  /**
   * Loads the model info by reading the model information from a CSV file,
   * processing the data, and storing it internally.
   * Throws an error if the model information is empty.
   *
   * @return {Promise<void>} A promise that resolves when the model information is successfully loaded.
   */
  /**
   * Loads the model information by reading and parsing the model_info.csv file.
   *
   * @throws Error if model_info.csv is missing or empty
   */
  async loadModelInfo(): Promise<void> {
    this.logger.info("Loading model info");

    const modelInfoDetails = await readCSV<IModelInfoRow>(`${this.state.modelPath}/model_info.csv`, this.logger);

    if (!modelInfoDetails.rows[0]) {
      throw new Error("Model info is empty");
    }

    this.state.modelInfo = transformModelInfo(modelInfoDetails.rows[0]);

    this.logger = createLogger(this.state.modelName);

    this.state.memoryStatus = MemoryStatus.MODEL_INFO_LOADED;

    this.logger.info("Model info loaded");
  }

  /**
   * Loads all model entities and relations from CSV files
   *
   * This method:
   * 1. Clears existing caches
   * 2. Loads all entity types (skills, occupations, etc.)
   * 3. Loads all relationship types
   * 4. Resolves original UUIDs for relationships
   * 5. Updates memory status to LOADED.
   *
   * @throws Error if any CSV files cannot be loaded or processed
   */
  async load(): Promise<void> {
    this.logger.info("Loading model");

    // load all the csv files in the model path
    this.logger.info("Importing csv files");

    const skillsService = new SkillsService(this);
    const skillGroupsService = new SkillGroupsService(this);
    const occupationsService = new OccupationService(this);
    const occupationGroupsService = new OccupationGroupsService(this);

    const skillToSkillRelationsService = new SkillToSkillService(this);
    const occupationToSkillsRelationsService = new OccupationToSkillRelationService(this);
    const occupationHierarchyService = new OccupationHierarchyService(this);
    const skillHierarchyService = new SkillHierarchyService(this);

    const taxonomyEntitiesServices: TaxonomyCollectionService[] = [
      skillsService,
      skillGroupsService,
      occupationsService,
      occupationGroupsService,
    ];

    // First, import the entities and relations from CSV Files.

    await Promise.all(taxonomyEntitiesServices.map((service) => service.loadFromCSV()));

    this.logger.info("CSV files imported");

    this.logger.info("Loading original UUIDs in the relations");

    const taxonomyRelationsServices: TaxonomyRelationService[] = [
      skillToSkillRelationsService,
      occupationToSkillsRelationsService,
      occupationHierarchyService,
      skillHierarchyService,
    ];

    // Then, load the original UUIDs for the relations.
    await Promise.all(taxonomyRelationsServices.map(async (service) => service.loadFromCSV()));

    this.logger.info("Original UUIDs loaded in the relations");

    this.state.memoryStatus = MemoryStatus.LOADED;
  }

  /**
   * Retrieves a skill entity by its unique identifier with caching
   *
   * @param id - The unique ID of the skill to retrieve
   * @returns The skill entity if found, undefined otherwise.
   */
  getSkillById(id: string) {
    if (!this.caches.skills.IDS.has(id)) {
      this.caches.skills.IDS.set(
        id,
        this.state.skills.find((skill) => skill.row.ID === id)
      );
    }

    return this.caches.skills.IDS.get(id);
  }

  /**
   * Retrieves an occupation group entity by its unique identifier with caching.
   *
   * @param id - The unique ID of the occupation group to retrieve
   * @returns The occupation group entity if found, undefined otherwise.
   */
  getOccupationGroupById(id: string) {
    if (!this.caches.occupationGroups.IDS.has(id)) {
      this.caches.occupationGroups.IDS.set(
        id,
        this.state.occupationGroups.find((occupationGroup) => occupationGroup.row.ID === id)
      );
    }

    return this.caches.occupationGroups.IDS.get(id);
  }

  /**
   * Retrieves an occupation entity by its unique identifier with caching
   *
   * @param id - The unique ID of the occupation to retrieve
   * @returns The occupation entity if found, undefined otherwise.
   */
  getOccupationById(id: string) {
    if (!this.caches.occupations.IDS.has(id)) {
      this.caches.occupations.IDS.set(
        id,
        this.state.occupations.find((occupation) => occupation.row.ID === id)
      );
    }

    return this.caches.occupations.IDS.get(id);
  }

  /**
   * Retrieves a skill group entity by its unique identifier with caching
   *
   * @param id - The unique ID of the skill group to retrieve
   * @returns The skill group entity if found, undefined otherwise
   */
  getSkillGroupById(id: string) {
    if (!this.caches.skillGroups.IDS.has(id)) {
      this.caches.skillGroups.IDS.set(
        id,
        this.state.skillGroups.find((skillGroup) => skillGroup.row.ID === id)
      );
    }

    return this.caches.skillGroups.IDS.get(id);
  }

  /**
   * Retrieves a skill entity by its original UUID with caching
   *
   * @param OriginUUID - The original UUID of the skill to retrieve
   * @returns The skill entity if found, undefined otherwise
   */
  getSKillByOriginUUID(OriginUUID: string) {
    if (!this.caches.skills.UUIDS.has(OriginUUID)) {
      this.caches.skills.UUIDS.set(
        OriginUUID,
        this.state.skills.find((skill) => skill.originUUID === OriginUUID)
      );
    }

    return this.caches.skills.UUIDS.get(OriginUUID);
  }

  /**
   * Retrieves an occupation entity by its original UUID with caching
   *
   * @param OriginUUID - The original UUID of the occupation to retrieve
   * @returns The occupation entity if found, undefined otherwise
   */
  getOccupationByOriginUUID(OriginUUID: string) {
    if (!this.caches.occupations.UUIDS.has(OriginUUID)) {
      this.caches.occupations.UUIDS.set(
        OriginUUID,
        this.state.occupations.find((occupation) => occupation.originUUID === OriginUUID)
      );
    }

    return this.caches.occupations.UUIDS.get(OriginUUID);
  }

  /**
   * Retrieves a skill group entity by its original UUID with caching
   *
   * @param OriginUUID - The original UUID of the skill group to retrieve
   * @returns The skill group entity if found, undefined otherwise
   */
  getSkillGroupByOriginUUID(OriginUUID: string) {
    if (!this.caches.skillGroups.UUIDS.has(OriginUUID)) {
      this.caches.skillGroups.UUIDS.set(
        OriginUUID,
        this.state.skillGroups.find((skillGroup) => skillGroup.originUUID === OriginUUID)
      );
    }

    return this.caches.skillGroups.UUIDS.get(OriginUUID);
  }

  /**
   * Retrieves an occupation group entity by its original UUID with caching
   *
   * @param OriginUUID - The original UUID of the occupation group to retrieve
   * @returns The occupation group entity if found, undefined otherwise
   */
  getOccupationGroupByOriginUUID(OriginUUID: string) {
    if (!this.caches.occupationGroups.UUIDS.has(OriginUUID)) {
      this.caches.occupationGroups.UUIDS.set(
        OriginUUID,
        this.state.occupationGroups.find((occupationGroup) => occupationGroup.originUUID === OriginUUID)
      );
    }

    return this.caches.occupationGroups.UUIDS.get(OriginUUID);
  }

  /**
   * Finds an occupation-to-skill relation by the original UUIDs of both entities
   *
   * @param occupationOriginUUID - The original UUID of the occupation
   * @param skillOriginUUID - The original UUID of the skill
   * @returns The relation if found, undefined otherwise
   */
  getOccupationToSkillRelationByOriginUUIDs(
    occupationOriginUUID: string,
    skillOriginUUID: string
  ): OccupationToSKillRelation | undefined {
    return this.state.occupationToSkill.find(
      (relation) =>
        relation.occupationOriginUUID === occupationOriginUUID && relation.skillOriginUUID === skillOriginUUID
    );
  }

  /**
   * Finds an occupation hierarchy relation matching the given relation structure
   *
   * @param relation - The occupation hierarchy relation to match
   * @returns The matching relation if found, undefined otherwise
   */
  getOccupationHierarchy(relation: OccupationHierarchy) {
    return this.state.occupationHierarchy.find(
      (hierarchy) =>
        hierarchy.parentOriginUUID === relation.parentOriginUUID &&
        hierarchy.childOriginUUID === relation.childOriginUUID &&
        hierarchy.PARENTOBJECTTYPE === relation.PARENTOBJECTTYPE &&
        hierarchy.CHILDOBJECTTYPE === relation.CHILDOBJECTTYPE
    );
  }

  /**
   * Finds a skill hierarchy relation matching the given relation structure
   *
   * @param row - The skill hierarchy relation to match
   * @returns The matching relation if found, undefined otherwise
   */
  getSKillHierarchy(row: SkillHierarchy) {
    return this.state.skillHierarchy.find(
      (hierarchy) =>
        hierarchy.parentOriginUUID === row.parentOriginUUID &&
        hierarchy.childOriginUUID === row.childOriginUUID &&
        hierarchy.PARENTOBJECTTYPE === row.PARENTOBJECTTYPE &&
        hierarchy.CHILDOBJECTTYPE === row.CHILDOBJECTTYPE
    );
  }

  /**
   * Finds a skill-to-skill relation by the original UUIDs of both skills
   *
   * @param requiredSkillOriginUUID - The original UUID of the required skill
   * @param requiringSkillOriginUUID - The original UUID of the requiring skill
   * @returns The relation if found, undefined otherwise
   */
  getSkillToSkillRelationByOriginUUIDs(requiredSkillOriginUUID: string, requiringSkillOriginUUID: string) {
    return this.state.skillToSkill.find(
      (row) =>
        row.requiredSkillOriginUUID === requiredSkillOriginUUID &&
        row.requiringSkillOriginUUID === requiringSkillOriginUUID
    );
  }
}
