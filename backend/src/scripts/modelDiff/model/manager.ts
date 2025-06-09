import type { IModelInfoRow } from "export/modelInfo/modelInfoToCSVTransform";

import { Caches, IModelManager, MemoryStatus } from "./types";
import { ModelState } from "./state";
import { ESCOCollectionService } from "../esco/types";
import { transformModelInfo } from "../esco/modelInfo";
import { SkillsService } from "../esco/skills";
import { SkillGroupsService } from "../esco/skillGroups";
import { OccupationService } from "../esco/occupations";
import { OccupationGroupsService } from "../esco/occupationGroups";
import { SkillToSkillService } from "../esco/skillToSkill";
import { OccupationToSkillRelationService } from "../esco/occupationToSkill";
import { OccupationHierarchyService } from "../esco/occupationHierarcy";
import { SkillHierarchyService } from "../esco/skillHierarchy";
import { readCSV } from "../esco/common";

export class ModelManager implements IModelManager {
  /**
   * The model Details in the state.
   */
  state: ModelState;

  /**
   * The model caches. Used to memoize the searches.
   */
  caches: Caches;

  constructor(modelPath: string) {
    this.state = new ModelState(modelPath);

    this.caches = {
      occupations: new Map(),
      skills: new Map(),
      skillGroups: new Map(),
      occupationGroups: new Map(),
    };
  }

  clearCaches() {
    this.caches = {
      occupations: new Map(),
      skills: new Map(),
      skillGroups: new Map(),
      occupationGroups: new Map(),
    };
  }

  /**
   * Loads the model info by reading the model information from a CSV file,
   * processing the data, and storing it internally.
   * Throws an error if the model information is empty.
   *
   * @return {Promise<void>} A promise that resolves when the model information is successfully loaded.
   */
  async loadModelInfo(): Promise<void> {
    console.info("Loading model info");

    const modelInfoDetails = await readCSV<IModelInfoRow>(`${this.state.modelPath}/model_info.csv`);

    if (!modelInfoDetails.rows[0]) {
      throw new Error("Model info is empty");
    }

    this.state.modelInfo = transformModelInfo(modelInfoDetails.rows[0]);

    this.state.memoryStatus = MemoryStatus.MODEL_INFO_LOADED;

    console.info("Model info loaded");
  }

  async load() {
    console.info("Loading model");

    // Clear the caches
    this.clearCaches();

    // load all the csv files in the model path
    console.info("Importing csv files");

    const skillsService = new SkillsService(this);
    const skillGroupsService = new SkillGroupsService(this);
    const occupationsService = new OccupationService(this);
    const occupationGroupsService = new OccupationGroupsService(this);

    const skillToSkillRelationsService = new SkillToSkillService(this);
    const occupationToSkillsRelationsService = new OccupationToSkillRelationService(this);
    const occupationHierarchyService = new OccupationHierarchyService(this);
    const skillHierarchyService = new SkillHierarchyService(this);

    const escoEntitiesServices: ESCOCollectionService[] = [
      skillsService,
      skillGroupsService,
      occupationsService,
      occupationGroupsService,
      skillToSkillRelationsService,
      occupationToSkillsRelationsService,
      occupationHierarchyService,
      skillHierarchyService,
    ];

    // First, import the entities and relations from CSV Files.
    await Promise.all(escoEntitiesServices.map((service) => service.loadFromCSV()));

    console.info("CSV files imported");
    console.info("Loading relations");

    skillsService.loadRelations();
    occupationGroupsService.loadRelations();
    occupationsService.loadRelations();
    skillGroupsService.loadRelations();

    console.info("Relations loaded");

    // Clear the caches
    this.clearCaches();

    this.state.memoryStatus = MemoryStatus.LOADED;
  }

  getSkillById(id: string) {
    if (this.caches.skills.has(id)) {
      return this.caches.skills.get(id);
    }

    return this.state.skills.find((skill) => skill.row.ID === id);
  }

  getOccupationToSKillsRelationsByOccupationId(id: string) {
    return this.state.occupationToSkill.filter((relation) => relation.OCCUPATIONID === id);
  }

  getOccupationToSKillsRelationsBySkillId(id: string) {
    return this.state.occupationToSkill.filter((relation) => relation.SKILLID === id);
  }

  getOccupationGroupById(id: string) {
    if (this.caches.occupationGroups.has(id)) {
      return this.caches.occupationGroups.get(id);
    }

    return this.state.occupationGroups.find((occupationGroup) => occupationGroup.row.ID === id);
  }

  getOccupationById(id: string) {
    if (this.caches.occupations.has(id)) {
      return this.caches.occupations.get(id);
    }

    return this.state.occupations.find((occupation) => occupation.row.ID === id);
  }

  getOccupationChildrenByOccupationId(id: string) {
    return this.state.occupationHierarchy.filter((relation) => relation.PARENTID === id);
  }

  getOccupationParentByOccupationId(id: string) {
    return this.state.occupationHierarchy.filter((relation) => relation.CHILDID === id);
  }

  getSkillParentBySkillId(id: string) {
    return this.state.skillHierarchy.filter((relation) => relation.CHILDID === id);
  }

  getSkillGroupById(id: string) {
    if (this.caches.skillGroups.has(id)) {
      return this.caches.skillGroups.get(id);
    }

    return this.state.skillGroups.find((skillGroup) => skillGroup.row.ID === id);
  }

  getSkillChildrenBySkillId(ID: string) {
    return this.state.skillHierarchy.filter((relation) => relation.PARENTID === ID);
  }

  getSKillByOriginalUUID(originalUUID: string) {
    return this.state.skills.find((skill) => skill.originalUUID === originalUUID);
  }

  getOccupationByOriginalUUID(originalUUID: string) {
    return this.state.occupations.find((occupation) => occupation.originalUUID === originalUUID);
  }

  getSkillGroupByOriginalUUID(originalUUID: string) {
    return this.state.skillGroups.find((skillGroup) => skillGroup.originalUUID === originalUUID);
  }

  getOccupationGroupByOriginalUUID(originalUUID: string) {
    return this.state.occupationGroups.find((occupationGroup) => occupationGroup.originalUUID === originalUUID);
  }
}
