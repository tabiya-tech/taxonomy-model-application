import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { readCSV } from "./utils";

import { IModelInfoDoc } from "modelInfo/modelInfo.types";
import { IModelInfoRow } from "export/modelInfo/modelInfoToCSVTransform";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import {
  IOccupationHierarchyImportRow,
  IOccupationToSkillRelationImportRow,
  ISkillHierarchyImportRow,
  ISkillToSkillsRelationImportRow,
} from "esco/common/entityToCSV.types";
import {
  importOccupationGroups,
  importOccupationHierarchy,
  importOccupations,
  importOccupationToSkillRelations,
  importSkillGroups,
  importSkillHierarchy,
  importSkills,
  importSkillToSkillRelations,
  loadOccupationGroupsRelations,
  loadOccupationsRelations,
  loadSkillGroupsRelations,
  loadSkillsRelations,
} from "scripts/modelDiff/utils/importing";
import {
  Caches,
  CSVEntities,
  CSVRelations,
  IModel,
  ModelStatus,
  Occupation,
  OccupationGroup,
  Skill,
  SkillGroup,
} from "./types";
import errorLogger from "common/errorLogger/errorLogger";

function getLogger(name: string) {
  return {
    info: (message: string) => {
      console.info(`[${new Date().toISOString()}] [${name}]`, message);
    },

    error: (message: string) => {
      errorLogger.logError(`[${new Date().toISOString()}] [${name}]`, message);
    },

    warning: (message: string) => {
      errorLogger.logWarning(`[${new Date().toISOString()}] [${name}]`, message);
    },
  };
}

/**
 * Transform Imported ModelInfo Row to IModelInfoDoc.
 *
 * @param modelInfo the imported model info row.
 * @returns the transformed model info document.
 */
export const transformModelInfo = (modelInfo: IModelInfoRow): IModelInfoDoc => {
  return {
    description: modelInfo.DESCRIPTION,
    license: "",
    locale: {
      name: modelInfo.LOCALE,
      UUID: randomUUID(),
      shortCode: modelInfo.LOCALE,
    },
    name: modelInfo.NAME,
    UUIDHistory: arrayFromString(modelInfo.UUIDHISTORY),
    UUID: arrayFromString(modelInfo.UUIDHISTORY)[0],
    released: modelInfo.RELEASED == "true",
    version: modelInfo.VERSION,
    releaseNotes: modelInfo.RELEASENOTES,
    importProcessState: new mongoose.Types.ObjectId(),
  };
};

export class Model implements IModel {
  /**
   * The model ID.
   */
  _modelId: string;

  /**
   * The model path.
   */
  _modelPath: string;

  /**
   * The model status.
   */
  _status: ModelStatus;

  /**
   * The model CSV entities.
   *  a) Skills
   *  b) Skill Groups
   *
   *  c) Occupations
   *  d) Occupation Groups
   */
  _csvEntities: CSVEntities;

  /**
   * The model CSV relations.
   *
   * a) Occupation to Skill relations
   * b) Occupation Hierarchy relations
   *
   * c) Skill Hierarchy relations
   * d) Skill to Skill relations.
   */
  _csvRelations: CSVRelations;

  /**
   * The model caches. Used to memoize the searches.
   *
   * a) Skills
   * b) Skill Groups
   *
   * c) Occupations
   * d) Occupation Groups
   */
  _caches: Caches;

  /**
   * The model info.
   */
  _modelInfo: IModelInfoDoc | null;

  /**
   * The model logger.
   */
  _logger: ReturnType<typeof getLogger>;

  constructor(modelPath: string) {
    this._modelId = randomUUID();
    this._modelPath = modelPath;

    this._status = ModelStatus.INITIALIZED;
    this._csvEntities = {
      occupations: [],
      skills: [],
      skillGroups: [],
      occupationGroups: [],
    };

    this._csvRelations = {
      occupationToSkill: [],
      occupationHierarchy: [],
      skillHierarchy: [],
      skillToSkill: [],
    };

    this._caches = {
      occupations: new Map(),
      skills: new Map(),
      skillGroups: new Map(),
      occupationGroups: new Map(),
    };

    this._modelInfo = null;

    this._logger = getLogger("");
  }

  setSkills(skills: Skill[]) {
    this._csvEntities.skills = skills;
  }

  setOccupations(occupations: Occupation[]) {
    this._csvEntities.occupations = occupations;
  }

  setSkillGroups(skillGroups: SkillGroup[]) {
    this._csvEntities.skillGroups = skillGroups;
  }

  setOccupationGroups(occupationGroups: OccupationGroup[]) {
    this._csvEntities.occupationGroups = occupationGroups;
  }

  setOccupationToSkill(occupationToSkill: IOccupationToSkillRelationImportRow[]) {
    this._csvRelations.occupationToSkill = occupationToSkill;
  }

  setOccupationHierarchy(occupationHierarchy: IOccupationHierarchyImportRow[]) {
    this._csvRelations.occupationHierarchy = occupationHierarchy;
  }

  setSkillHierarchy(skillHierarchy: ISkillHierarchyImportRow[]) {
    this._csvRelations.skillHierarchy = skillHierarchy;
  }

  setSkillToSkill(skillToSkill: ISkillToSkillsRelationImportRow[]) {
    this._csvRelations.skillToSkill = skillToSkill;
  }

  clearCaches() {
    this._caches = {
      occupations: new Map(),
      skills: new Map(),
      skillGroups: new Map(),
      occupationGroups: new Map(),
    };
  }

  async loadModelInfo() {
    this._logger.info("Loading model info");

    const modelInfoDetails = await readCSV<IModelInfoRow>(`${this._modelPath}/model_info.csv`);

    if (!modelInfoDetails.rows[0]) {
      throw new Error("Model info is empty");
    }

    this._modelInfo = transformModelInfo(modelInfoDetails.rows[0]);

    this._logger = getLogger(`${this._modelInfo.name} - ${this._modelInfo.version}`);

    this._status = ModelStatus.MODEL_INFO_LOADED;

    this._logger.info("Model info loaded");
  }

  async load() {
    this._logger.info("Loading model");

    // Clear the caches
    this.clearCaches();

    // load all the csv files in the model path
    this._logger.info("Importing csv files");

    // First import the entities and relations.
    await Promise.all(
      [
        importSkills(this),
        importOccupationGroups(this),
        importOccupations(this),
        importSkillGroups(this),

        importOccupationHierarchy(this),
        importSkillToSkillRelations(this),
        importOccupationToSkillRelations(this),
        importSkillHierarchy(this),
      ].map((f) => f())
    );

    this._logger.info("CSV files imported");
    this._logger.info("Loading relations");

    // Then construct the relations.
    await Promise.all(
      [
        loadOccupationsRelations.bind(null, this),
        loadSkillsRelations.bind(null, this),
        loadOccupationGroupsRelations.bind(null, this),
        loadSkillGroupsRelations.bind(null, this),
      ].map((f) => f())
    );

    this._logger.info("Relations loaded");

    // Clear the caches
    this.clearCaches();

    this._status = ModelStatus.LOADED;
  }

  getSkillById(id: string) {
    if (this._caches.skills.has(id)) {
      return this._caches.skills.get(id);
    }

    return this._csvEntities.skills.find((skill) => skill.row.ID === id);
  }

  getOccupationToSKillsRelationsByOccupationId(id: string) {
    return this._csvRelations.occupationToSkill.filter((relation) => relation.OCCUPATIONID === id);
  }

  getOccupationToSKillsRelationsBySkillId(id: string) {
    return this._csvRelations.occupationToSkill.filter((relation) => relation.SKILLID === id);
  }

  getOccupationGroupById(id: string) {
    if (this._caches.occupationGroups.has(id)) {
      return this._caches.occupationGroups.get(id);
    }

    return this._csvEntities.occupationGroups.find((occupationGroup) => occupationGroup.row.ID === id);
  }

  getOccupationById(id: string) {
    if (this._caches.occupations.has(id)) {
      return this._caches.occupations.get(id);
    }

    return this._csvEntities.occupations.find((occupation) => occupation.row.ID === id);
  }

  getOccupationChildrenByOccupationId(id: string) {
    return this._csvRelations.occupationHierarchy.filter((relation) => relation.PARENTID === id);
  }

  getOccupationParentByOccupationId(id: string) {
    return this._csvRelations.occupationHierarchy.filter((relation) => relation.CHILDID === id);
  }

  getSkillParentBySkillId(id: string) {
    return this._csvRelations.skillHierarchy.filter((relation) => relation.CHILDID === id);
  }

  getSkillGroupById(id: string) {
    if (this._caches.skillGroups.has(id)) {
      return this._caches.skillGroups.get(id);
    }

    return this._csvEntities.skillGroups.find((skillGroup) => skillGroup.row.ID === id);
  }

  getSkillChildrenBySkillId(ID: string) {
    return this._csvRelations.skillHierarchy.filter((relation) => relation.PARENTID === ID);
  }

  getSKillByOriginalUUID(originalUUID: string) {
    return this._csvEntities.skills.find((skill) => skill.originalUUID === originalUUID);
  }

  getOccupationByOriginalUUID(originalUUID: string) {
    return this._csvEntities.occupations.find((occupation) => occupation.originalUUID === originalUUID);
  }

  getSkillGroupByOriginalUUID(originalUUID: string) {
    return this._csvEntities.skillGroups.find((skillGroup) => skillGroup.originalUUID === originalUUID);
  }

  getOccupationGroupByOriginalUUID(originalUUID: string) {
    return this._csvEntities.occupationGroups.find((occupationGroup) => occupationGroup.originalUUID === originalUUID);
  }
}
