import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IModelInfo, IModelInfoDoc, INewModelInfoSpec } from "./modelInfo.types";
import { populateImportProcessStateOptions } from "./populateImportProcessStateOptions";

export interface IModelRepository {
  readonly Model: mongoose.Model<IModelInfoDoc>;

  /**
   * Creates a new ModelInfo entry.
   *
   * @param {INewModelInfoSpec} newModelSpec - The specification for the new ModelInfo entry.
   * @return {Promise<INewModelInfoSpec>} - A Promise that resolves to the newly created ModelInfo entry.
   * Rejects with an error if the ModelInfo entry cannot be created.
   */
  create(newModelSpec: INewModelInfoSpec): Promise<IModelInfo>;

  /**
   * Finds a ModelInfo entry by its ID.
   *
   * @param {string} modelId - The unique ID of the ModelInfo entry.
   * @return {Promise<IModelInfo|null>} - A Promise that resolves to the found ModelInfo entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  getModelById(modelId: string): Promise<IModelInfo | null>;

  /**
   * Finds a ModelInfo entry by its UUID.
   *
   * @param {string} uuid - The unique ID of the ModelInfo entry.
   * @return {Promise<IModelInfo|null>} - A Promise that resolves to the found ModelInfo entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  getModelByUUID(uuid: string): Promise<IModelInfo | null>;

  /**
   * Get all ModelInfo entries.
   *
   * @return {Promise<IModelInfo[]>} - A promise that resolves to an array with all the ModelInfo entries.
   * Rejects with an error if the operation fails.
   */
  getModels(): Promise<IModelInfo[]>;
}

export class ModelRepository implements IModelRepository {
  public readonly Model: mongoose.Model<IModelInfoDoc>;

  constructor(model: mongoose.Model<IModelInfoDoc>) {
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
        originUUID: "",
        previousUUID: "",
        version: "",
        releaseNotes: "",
        released: false,
        importProcessState: new mongoose.Types.ObjectId(), // models are created empty and are populated asynchronously with data via an import process
      });
      await newModelInfo.save();
      await newModelInfo.populate(populateImportProcessStateOptions);
      return newModelInfo.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async getModelById(modelId: string): Promise<IModelInfo | null> {
    try {
      const modelInfo = await this.Model.findById(modelId).populate(populateImportProcessStateOptions).exec();
      return modelInfo != null ? modelInfo.toObject() : null;
    } catch (e: unknown) {
      console.error("getModelById failed", e);
      throw e;
    }
  }

  async getModelByUUID(modelUUID: string): Promise<IModelInfo | null> {
    try {
      // Without the $eq, the NoSQL injection can be prevented by setting the sanitizeFilter = true
      const filter = {
        UUID: { $eq: modelUUID },
      };
      const modelInfo = await this.Model.findOne(filter).populate(populateImportProcessStateOptions).exec();
      return modelInfo != null ? modelInfo.toObject() : null;
    } catch (e: unknown) {
      console.error("getModelByUUID failed", e);
      throw e;
    }
  }

  async getModels(): Promise<IModelInfo[]> {
    try {
      const modelInfos = await this.Model.find({}).populate(populateImportProcessStateOptions).exec();
      return modelInfos.map((modelInfo) => modelInfo.toObject());
    } catch (e: unknown) {
      console.error("getModels failed", e);
      throw e;
    }
  }
}