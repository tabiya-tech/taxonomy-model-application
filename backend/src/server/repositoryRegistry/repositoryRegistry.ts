import {IModelRepository, ModelRepository} from "modelInfo/ModelInfoRepository";
import mongoose, {Connection} from "mongoose";
import * as modelInfoModel from "modelInfo/modelInfoModel";
import * as ISCOGroupModel from "esco/iscoGroup/ISCOGroupModel";
import * as skillGroupModel from "esco/skillGroup/skillGroupModel";
import * as skillModel from "esco/skill/skillModel";
import * as occupationModel from "esco/occupation/occupationModel";
import * as occupationHierarchyModel from "esco/occupationHierarchy/occupationHierarchyModel";
import * as importStateModel from "import/ImportProcessState/importProcessStateModel";

import {IISCOGroupRepository, ISCOGroupRepository} from "esco/iscoGroup/ISCOGroupRepository";
import {ISkillGroupRepository, SkillGroupRepository} from "esco/skillGroup/SkillGroupRepository";
import {ISkillRepository, SkillRepository} from "esco/skill/SkillRepository";
import {IOccupationRepository, OccupationRepository} from "esco/occupation/OccupationRepository";
import {
  IOccupationHierarchyRepository,
  OccupationHierarchyRepository
} from "esco/occupationHierarchy/occupationHierarchyRepository";
import {
  IImportProcessStateRepository,
  ImportProcessStateRepository
} from "import/ImportProcessState/importProcessStateRepository";

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

  public get occupationHierarchy(): IOccupationHierarchyRepository {
    return this._repositories.get("IOccupationHierarchyRepository");
  }

  public set occupationHierarchy(repository: IOccupationHierarchyRepository) {
    this._repositories.set("IOccupationHierarchyRepository", repository);
  }

  public get importProcessState(): IImportProcessStateRepository {
    return this._repositories.get("IImportProcessStateRepository");
  }

  public set importProcessState(repository: IImportProcessStateRepository) {
    this._repositories.set("IImportProcessStateRepository", repository);
  }

  async initialize(connection: Connection | undefined) {
    if (!connection) throw new Error("Connection is undefined");

    // Set up mongoose
    // Apply to all schemas the transforms to get lean representations of the documents
    const toFunction = {
      virtuals: true,
      versionKey: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform(doc: any, ret: any) {
        // Delete any object attributes we do not need in our projections
        //delete ret.id;

        if (ret.modelId && ret.modelId instanceof mongoose.Types.ObjectId) {
          ret.modelId = ret.modelId.toString(); // Convert modelId to string
        }
        if (ret.parentId && ret.parentId instanceof mongoose.Types.ObjectId) {
          ret.parentId = ret.parentId.toString(); // Convert parentId to string
        }
        if (ret.childId && ret.childId instanceof mongoose.Types.ObjectId) {
          ret.childId = ret.childId.toString(); // Convert childId to string
        }
        if (ret.importProcessState?.id && ret.importProcessState?.id instanceof mongoose.Types.ObjectId) {
          ret.importProcessState.id = ret.importProcessState.id.toString(); // Convert importProcessStateId to string
        }

        delete ret._id;
        delete ret.__v;
      }
    };
    mongoose.plugin((schema) => {
      // @ts-ignore
      schema.options.toObject = toFunction;
      // @ts-ignore
      schema.options.toJSON = toFunction;
    });

    // Set up the ModelRepository
    this.modelInfo = new ModelRepository(modelInfoModel.initializeSchemaAndModel(connection));
    this.ISCOGroup = new ISCOGroupRepository(ISCOGroupModel.initializeSchemaAndModel(connection));
    this.skillGroup = new SkillGroupRepository(skillGroupModel.initializeSchemaAndModel(connection));
    this.skill = new SkillRepository(skillModel.initializeSchemaAndModel(connection));
    this.occupation = new OccupationRepository(occupationModel.initializeSchemaAndModel(connection));
    this.occupationHierarchy = new OccupationHierarchyRepository(occupationHierarchyModel.initializeSchemaAndModel(connection), this.ISCOGroup.Model, this.occupation.Model);
    this.importProcessState = new ImportProcessStateRepository(importStateModel.initializeSchemaAndModel(connection));

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
    await this.occupationHierarchy.hierarchyModel.createIndexes();
    await this.importProcessState.Model.createIndexes();
  }
}

const _repositoryRegistryInstance: RepositoryRegistry = new RepositoryRegistry();

export function getRepositoryRegistry(): RepositoryRegistry {
  return _repositoryRegistryInstance;
}

