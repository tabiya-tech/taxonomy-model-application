import {IModelRepository, ModelRepository} from "modelInfo/ModelRepository";
import mongoose, {Connection} from "mongoose";
import * as modelInfoModel from "modelInfo/modelInfoModel";
import * as ISCOGroupModel from "iscoGroup/ISCOGroupModel";
import {IISCOGroupRepository, ISCOGroupRepository} from "../../iscoGroup/ISCOGroupRepository";

export class RepositoryRegistry {
  // eslint-disable-next-line
  private readonly _repositories: Map<string,any> = new Map<string, any>();
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

  initialize(connection: Connection | undefined) {
    if(!connection) throw new Error("Connection is undefined");

    // Set up mongoose
    // Apply to all schemas the transforms to get lean representations of the documents
    const toFunction = {
      virtuals: true,
      versionKey: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform(doc: any, ret: any) {
        // Delete any object attributes we do not need in our projections
        //delete ret.id;
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
  }
}

const _repositoryRegistryInstance: RepositoryRegistry = new RepositoryRegistry();
export function getRepositoryRegistry(): RepositoryRegistry {
  return _repositoryRegistryInstance;
}

