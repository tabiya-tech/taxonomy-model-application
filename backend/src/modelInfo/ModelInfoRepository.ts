import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IModelInfo, IModelInfoDoc, INewModelInfoSpec } from "./modelInfo.types";
import { populateImportProcessStateOptions } from "./populateImportProcessStateOptions";

export interface IModelRepository {
  readonly Model: mongoose.Model<IModelInfoDoc>;

  /**
   * Resolves to the newly created model entry, or it rejects with an error if the model entry could not be created.
   * Models are created empty and are populated with data asynchronously via an import process.
   * For that reason the id of importProcessState is set upon creation and refers to the future (or latest if it was initiated) import process.
   * The importProcessState id is used from the import process to store the progress of the import.
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
