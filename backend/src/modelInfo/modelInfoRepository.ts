import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IModelInfo, IModelInfoDoc, IModelInfoReference, INewModelInfoSpec } from "./modelInfo.types";
import { populateImportProcessStateOptions } from "./populateImportProcessStateOptions";
import { populateExportProcessStateOptions } from "./populateExportProcessStateOptions";
import { populateEmbeddingProcessStateOptions } from "./populateEmbeddingProcessStateOptions";

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

  /**
   * Get UUIDHistory for a model.
   *
   * @return {Promise<IModelInfoReference[]>} - A promise that resolves to an array with the UUIDHistory for the model. if the model does not exist it returns an empty array
   * @param uuids - The UUIDs to resolve, if the uuid does not exist we return an object with that uuid, and null for the rest of the fields
   */
  getHistory(uuids: string[]): Promise<IModelInfoReference[]>;

  /**
   * Finds the full ModelInfo entries whose id is in the provided list.
   *
   * @param {string[]} ids - The ids of the ModelInfo entries to retrieve.
   * @return {Promise<IModelInfo[]>} - A promise that resolves to an array with the found ModelInfo entries.
   * Only the models that exist are returned, so the result may be shorter than the input and is not ordered by the input.
   * Rejects with an error if the operation fails.
   */
  getModelsByIds(ids: string[]): Promise<IModelInfo[]>;

  /**
   * Releases a ModelInfo entry: sets released to true and optionally records releaseNotes.
   * Once released, the ESCO entities under this model become read-only (enforced elsewhere).
   *
   * The update is conditional on the model currently being unreleased, so this is safe to call
   * concurrently: only one caller can win the transition from unreleased to released. Assumes
   * modelId is already a valid ObjectId - the caller is responsible for that validation.
   *
   * @param {string} modelId - The id of the model to release. Must be a valid ObjectId.
   * @param {string} [releaseNotes] - Optional release notes to store alongside the release. If omitted, the existing releaseNotes are left unchanged.
   * @return {Promise<IModelInfo|null>} - A Promise that resolves to the updated ModelInfo entry, or null if no unreleased model exists with the given id (either it doesn't exist, or it is already released).
   * Rejects with an error if the operation fails.
   */
  releaseModel(modelId: string, releaseNotes?: string): Promise<IModelInfo | null>;
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
      const newUUID = randomUUID();
      const newModelInfo = new this.Model({
        ...newModelSpec,
        UUID: newUUID,
        version: "",
        releaseNotes: "",
        released: false,
        importProcessState: new mongoose.Types.ObjectId(), // models are created empty and are populated asynchronously with data via an import process
      });
      newModelInfo.UUIDHistory.unshift(newUUID);
      await newModelInfo.save();
      await newModelInfo.populate([
        populateImportProcessStateOptions,
        populateExportProcessStateOptions,
        populateEmbeddingProcessStateOptions,
      ]);
      return newModelInfo.toObject();
    } catch (e: unknown) {
      const err = new Error("ModelInfoRepository.create: create failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async getModelById(modelId: string): Promise<IModelInfo | null> {
    try {
      const modelInfo = await this.Model.findById(modelId)
        .populate([
          populateImportProcessStateOptions,
          populateExportProcessStateOptions,
          populateEmbeddingProcessStateOptions,
        ])
        .exec();
      return modelInfo != null ? modelInfo.toObject() : null;
    } catch (e: unknown) {
      const err = new Error("ModelInfoRepository.getModelById: getModelById failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async getModelByUUID(modelUUID: string): Promise<IModelInfo | null> {
    try {
      // Without the $eq, the NoSQL injection can be prevented by setting the sanitizeFilter = true
      const filter = {
        UUID: { $eq: modelUUID },
      };
      const modelInfo = await this.Model.findOne(filter)
        .populate([
          populateImportProcessStateOptions,
          populateExportProcessStateOptions,
          populateEmbeddingProcessStateOptions,
        ])
        .exec();
      return modelInfo != null ? modelInfo.toObject() : null;
    } catch (e: unknown) {
      const err = new Error("ModelInfoRepository.getModelByUUID: getModelByUUID failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async getModels(): Promise<IModelInfo[]> {
    try {
      const modelInfos = await this.Model.find({})
        .populate([
          populateImportProcessStateOptions,
          populateExportProcessStateOptions,
          populateEmbeddingProcessStateOptions,
        ])
        .exec();
      return modelInfos.map((modelInfo) => modelInfo.toObject());
    } catch (e: unknown) {
      const err = new Error("ModelInfoRepository.getModels: getModels failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async getHistory(uuids: string[]): Promise<IModelInfoReference[]> {
    try {
      // Turns out mongoose adds the $in operator automatically, and fails for string fields if we try to use $in
      const modelsFromDb = await this.Model.find(
        { UUID: uuids },
        {
          UUID: 1,
          name: 1,
          version: 1,
          locale: 1,
          _id: 1,
        }
      ).exec();

      // Create a map of UUIDs to models for easy lookup
      const modelsMap = new Map(modelsFromDb.map((model) => [model.UUID, model]));

      return uuids.map((uuid) => {
        const model = modelsMap.get(uuid);
        if (model) {
          return {
            id: model._id.toString(),
            UUID: model.UUID,
            name: model.name,
            version: model.version,
            localeShortCode: model.locale.shortCode,
          };
        } else {
          // Return null values for UUIDs not found in the database
          return {
            id: null,
            UUID: uuid,
            name: null,
            version: null,
            localeShortCode: null,
          };
        }
      });
    } catch (e) {
      // Handle any errors
      const err = new Error("ModelInfoRepository.getUUIDHistory: getUUIDHistory failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async getModelsByIds(ids: string[]): Promise<IModelInfo[]> {
    try {
      const objectIds = ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      // Pass a bare array (not an explicit { $in: [...] }): mongoose applies $in automatically, and unlike an
      // operator object this is not rewritten by the connection's sanitizeFilter=true. Same idiom as getHistory().
      const modelInfos = await this.Model.find({ _id: objectIds })
        .populate([
          populateImportProcessStateOptions,
          populateExportProcessStateOptions,
          populateEmbeddingProcessStateOptions,
        ])
        .exec();
      return modelInfos.map((modelInfo) => modelInfo.toObject());
    } catch (e: unknown) {
      const err = new Error("ModelInfoRepository.getModelsByIds: getModelsByIds failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async releaseModel(modelId: string, releaseNotes?: string): Promise<IModelInfo | null> {
    try {
      // The released:false filter makes this an atomic "only transition once" update.
      const modelInfo = await this.Model.findOneAndUpdate(
        { _id: modelId, released: false },
        { $set: { released: true, ...(releaseNotes !== undefined ? { releaseNotes } : {}) } },
        { new: true }
      )
        .populate([
          populateImportProcessStateOptions,
          populateExportProcessStateOptions,
          populateEmbeddingProcessStateOptions,
        ])
        .exec();
      return modelInfo != null ? modelInfo.toObject() : null;
    } catch (e: unknown) {
      const err = new Error("ModelInfoRepository.releaseModel: releaseModel failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
