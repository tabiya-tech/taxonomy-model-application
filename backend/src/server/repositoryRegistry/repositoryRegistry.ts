import { IModelRepository, ModelRepository } from "modelInfo/modelInfoRepository";
import { Connection } from "mongoose";
import * as modelInfoModel from "modelInfo/modelInfoModel";
import * as ISCOGroupModel from "esco/iscoGroup/ISCOGroupModel";
import * as skillGroupModel from "esco/skillGroup/skillGroupModel";
import * as skillModel from "esco/skill/skillModel";
import * as occupationModel from "esco/occupation/occupationModel";
import * as localizedOccupationModel from "esco/localizedOccupation/localizedOccupationModel";
import * as occupationHierarchyModel from "esco/occupationHierarchy/occupationHierarchyModel";
import * as skillHierarchyModel from "esco/skillHierarchy/skillHierarchyModel";
import * as skillToSkillRelationModel from "esco/skillToSkillRelation/skillToSkillRelationModel";
import * as occupationToSkillRelationModel from "esco/occupationToSkillRelation/occupationToSkillRelationModel";
import * as importStateModel from "import/ImportProcessState/importProcessStateModel";
import * as exportProcessStateModel from "export/exportProcessState/exportProcessStateModel";

import { IISCOGroupRepository, ISCOGroupRepository } from "esco/iscoGroup/ISCOGroupRepository";
import { ISkillGroupRepository, SkillGroupRepository } from "esco/skillGroup/skillGroupRepository";
import { ISkillRepository, SkillRepository } from "esco/skill/skillRepository";
import { IOccupationRepository, OccupationRepository } from "esco/occupation/occupationRepository";
import {
  IOccupationHierarchyRepository,
  OccupationHierarchyRepository,
} from "esco/occupationHierarchy/occupationHierarchyRepository";
import {
  IImportProcessStateRepository,
  ImportProcessStateRepository,
} from "import/ImportProcessState/importProcessStateRepository";
import { ISkillHierarchyRepository, SkillHierarchyRepository } from "esco/skillHierarchy/skillHierarchyRepository";
import {
  ISkillToSkillRelationRepository,
  SkillToSkillRelationRepository,
} from "esco/skillToSkillRelation/skillToSkillRelationRepository";
import {
  IOccupationToSkillRelationRepository,
  OccupationToSkillRelationRepository,
} from "esco/occupationToSkillRelation/occupationToSkillRelationRepository";
import {
  ILocalizedOccupationRepository,
  LocalizedOccupationRepository,
} from "esco/localizedOccupation/localizedOccupationRepository";
import {
  ExportProcessStateRepository,
  IExportProcessStateRepository,
} from "export/exportProcessState/exportProcessStateRepository";

export class RepositoryRegistry {
  // eslint-disable-next-line
  private readonly _repositories: Map<string, any> = new Map<string, any>();

  public get modelInfo(): IModelRepository {
    return this._repositories.get("ModelRepository");
  }

  public set modelInfo(repository: IModelRepository) {
    this._repositories.set("ModelRepository", repository);
  }

  public get ISCOGroup(): IISCOGroupRepository {
    return this._repositories.get("ISCOGroupRepository");
  }

  public set ISCOGroup(repository: IISCOGroupRepository) {
    this._repositories.set("ISCOGroupRepository", repository);
  }

  public get skillGroup(): ISkillGroupRepository {
    return this._repositories.get("ISkillGroupRepository");
  }

  public set skillGroup(repository: ISkillGroupRepository) {
    this._repositories.set("ISkillGroupRepository", repository);
  }

  public get skill(): ISkillRepository {
    return this._repositories.get("ISkillRepository");
  }

  public set skill(repository: ISkillRepository) {
    this._repositories.set("ISkillRepository", repository);
  }

  public get occupation(): IOccupationRepository {
    return this._repositories.get("IOccupationRepository");
  }

  public set occupation(repository: IOccupationRepository) {
    this._repositories.set("IOccupationRepository", repository);
  }

  public get localizedOccupation(): ILocalizedOccupationRepository {
    return this._repositories.get("ILocalizedOccupationRepository");
  }

  public set localizedOccupation(repository: ILocalizedOccupationRepository) {
    this._repositories.set("ILocalizedOccupationRepository", repository);
  }

  public get occupationHierarchy(): IOccupationHierarchyRepository {
    return this._repositories.get("IOccupationHierarchyRepository");
  }

  public set occupationHierarchy(repository: IOccupationHierarchyRepository) {
    this._repositories.set("IOccupationHierarchyRepository", repository);
  }

  public get skillHierarchy(): ISkillHierarchyRepository {
    return this._repositories.get("ISkillHierarchyRepository");
  }

  public set skillHierarchy(repository: ISkillHierarchyRepository) {
    this._repositories.set("ISkillHierarchyRepository", repository);
  }

  public get skillToSkillRelation(): ISkillToSkillRelationRepository {
    return this._repositories.get("ISkillToSkillRelationRepository");
  }

  public set skillToSkillRelation(repository: ISkillToSkillRelationRepository) {
    this._repositories.set("ISkillToSkillRelationRepository", repository);
  }

  public set occupationToSkillRelation(repository: IOccupationToSkillRelationRepository) {
    this._repositories.set("IOccupationToSkillRelationRepository", repository);
  }

  public get occupationToSkillRelation(): IOccupationToSkillRelationRepository {
    return this._repositories.get("IOccupationToSkillRelationRepository");
  }

  public get importProcessState(): IImportProcessStateRepository {
    return this._repositories.get("IImportProcessStateRepository");
  }

  public set importProcessState(repository: IImportProcessStateRepository) {
    this._repositories.set("IImportProcessStateRepository", repository);
  }

  public get exportProcessState(): IExportProcessStateRepository {
    return this._repositories.get("IExportProcessStateRepository");
  }

  public set exportProcessState(repository: IExportProcessStateRepository) {
    this._repositories.set("IExportProcessStateRepository", repository);
  }

  async initialize(connection: Connection | undefined) {
    if (!connection) throw new Error("Connection is undefined");

    // Set up the ModelRepository
    this.modelInfo = new ModelRepository(modelInfoModel.initializeSchemaAndModel(connection));
    this.ISCOGroup = new ISCOGroupRepository(ISCOGroupModel.initializeSchemaAndModel(connection));
    this.skillGroup = new SkillGroupRepository(skillGroupModel.initializeSchemaAndModel(connection));
    this.skill = new SkillRepository(skillModel.initializeSchemaAndModel(connection));
    this.occupation = new OccupationRepository(occupationModel.initializeSchemaAndModel(connection));
    this.localizedOccupation = new LocalizedOccupationRepository(
      localizedOccupationModel.initializeSchemaAndModel(connection),
      this.occupation.Model
    );
    this.occupationHierarchy = new OccupationHierarchyRepository(
      occupationHierarchyModel.initializeSchemaAndModel(connection),
      this.ISCOGroup.Model,
      this.occupation.Model
    );
    this.skillHierarchy = new SkillHierarchyRepository(
      skillHierarchyModel.initializeSchemaAndModel(connection),
      this.skill.Model,
      this.skillGroup.Model
    );
    this.skillToSkillRelation = new SkillToSkillRelationRepository(
      skillToSkillRelationModel.initializeSchemaAndModel(connection),
      this.skill.Model
    );
    this.occupationToSkillRelation = new OccupationToSkillRelationRepository(
      occupationToSkillRelationModel.initializeSchemaAndModel(connection),
      this.skill.Model,
      this.occupation.Model,
      this.localizedOccupation.Model
    );
    this.importProcessState = new ImportProcessStateRepository(importStateModel.initializeSchemaAndModel(connection));
    this.exportProcessState = new ExportProcessStateRepository(
      exportProcessStateModel.initializeSchemaAndModel(connection)
    );

    // Set up the indexes
    // This is done here because the autoIndex is turned off in production
    // In a production environment,
    // the indexes must be created manually before the application is started for the first time,
    // and it the future this code should be moved in to deployment scripts.
    // If indexes are not created then, queries will become inefficient, unique constrains will not be enforced.
    await this.modelInfo.Model.createIndexes();
    await this.ISCOGroup.Model.createIndexes();
    await this.skillGroup.Model.createIndexes();
    await this.skill.Model.createIndexes();
    await this.occupation.Model.createIndexes();
    await this.localizedOccupation.Model.createIndexes();
    await this.occupationHierarchy.hierarchyModel.createIndexes();
    await this.skillHierarchy.hierarchyModel.createIndexes();
    await this.skillToSkillRelation.relationModel.createIndexes();
    await this.occupationToSkillRelation.relationModel.createIndexes();
    await this.importProcessState.Model.createIndexes();
    await this.exportProcessState.Model.createIndexes();
  }
}

const _repositoryRegistryInstance: RepositoryRegistry = new RepositoryRegistry();

export function getRepositoryRegistry(): RepositoryRegistry {
  return _repositoryRegistryInstance;
}
