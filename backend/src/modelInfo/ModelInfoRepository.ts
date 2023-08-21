import mongoose from "mongoose";
import {IModelInfo, INewModelInfoSpec} from "./modelInfoModel";
import {randomUUID} from "crypto";

export interface IModelRepository {
  readonly Model: mongoose.Model<IModelInfo>;

  /**
   * Resolves to the newly created model entry, or it rejects with an error if the model entry could not be created.
   * @param newModelSpec
   */
  create(newModelSpec: INewModelInfoSpec): Promise<IModelInfo>;

  /**
   * Get model an entry by modelId
   * @param modelId
   * @return returns the model entry if found or null otherwise.
   */
  getModelById(modelId: string): Promise<IModelInfo | null>;

  /**
   * Get model an entry by model uuid
   * @param uuid
   * @return returns the model entry if found or null otherwise.
   */
  getModelByUUID(uuid: string): Promise<IModelInfo | null>;

  /**
   * Get all models from the database
   * @return An array of all model entries.
   */
  getModels(): Promise<IModelInfo[]>;
}


export class ModelRepository implements IModelRepository {

  public readonly Model: mongoose.Model<IModelInfo>;

  constructor(model: mongoose.Model<IModelInfo>) {
    this.Model = model;
  }

  async create(newModelSpec: INewModelInfoSpec): Promise<IModelInfo> {
    try {
      //@ts-ignore
      if (newModelSpec.UUID !== undefined) {
        throw new Error("UUID should not be provided");
      }
      const newModelInfo = new this.Model({
        ...newModelSpec,
        UUID: randomUUID(),
        originUUID:"",
        previousUUID:"",
        version:"",
        releaseNotes:"",
        released:false,
      });
      await newModelInfo.save();
      return newModelInfo.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async getModelById(modelId: string): Promise<IModelInfo | null> {
    try {
      const modelInfo = await this.Model.findById(modelId).exec();
      return (modelInfo != null ? modelInfo.toObject() : null);
    } catch (e: unknown) {
      console.error("getModelById failed", e);
      throw e;
    }
  }

  async getModelByUUID(modelUUID: string): Promise<IModelInfo | null> {
    try {
      // Without the $eq, the NoSQL injection can be prevented by setting the sanitizeFilter = true
      const filter = {
        UUID: {$eq: modelUUID},
      };
      const modelInfo = await this.Model.findOne(filter).exec();
      return (modelInfo != null ? modelInfo.toObject() : null);
    } catch (e: unknown) {
      console.error("getModelByUUID failed", e);
      throw e;
    }
  }

  async getModels():Promise<IModelInfo[]>{
    try {
      const modelInfos = await this.Model.find({}).exec();
      return modelInfos.map((modelInfo) => modelInfo.toObject());
    } catch (e: unknown) {
      console.error("getModels failed", e);
      throw e;
    }
  }
}