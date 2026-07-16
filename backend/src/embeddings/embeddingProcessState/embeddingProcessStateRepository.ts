import mongoose from "mongoose";
import ModelInfoApiSpecs from "api-specifications/modelInfo";
import {
  IEmbeddingProcessState,
  IEmbeddingProcessStateDoc,
  IIncrementEmbeddingProcessStateCountsSpec,
  INewEmbeddingProcessStateSpec,
  IUpdateEmbeddingProcessStateSpec,
} from "./embeddingProcessState.types";

export interface IEmbeddingProcessStateRepository {
  readonly Model: mongoose.Model<IEmbeddingProcessStateDoc>;

  /**
   * Creates a new EmbeddingProcessState entry.
   *
   * @param {INewEmbeddingProcessStateSpec} newSpecs - The specification for the new EmbeddingProcessState entry.
   * @return {Promise<IEmbeddingProcessState>} - A Promise that resolves to the newly created EmbeddingProcessState entry.
   * Rejects with an error if the EmbeddingProcessState entry cannot be created.
   */
  create(newSpecs: INewEmbeddingProcessStateSpec): Promise<IEmbeddingProcessState>;

  /**
   * Updates the EmbeddingProcessState entry with the given ID.
   *
   * @param {string} id - The unique ID of the EmbeddingProcessState entry.
   * @param {IUpdateEmbeddingProcessStateSpec} updateSpecs - The specification to update with
   * @return {Promise<IEmbeddingProcessState>} - A Promise that resolves to the updated EmbeddingProcessState entry.
   * Rejects with an error if the EmbeddingProcessState entry cannot be updated.
   */
  update(id: string, updateSpecs: IUpdateEmbeddingProcessStateSpec): Promise<IEmbeddingProcessState>;

  /**
   * Atomically increments the progress counters of the EmbeddingProcessState entry with the given ID.
   * Increments are atomic ($inc), so that concurrent lambda invocations do not lose updates.
   *
   * @param {string} id - The unique ID of the EmbeddingProcessState entry.
   * @param {IIncrementEmbeddingProcessStateCountsSpec} increments - The counters to increment and by how much.
   * @return {Promise<IEmbeddingProcessState>} - A Promise that resolves to the updated EmbeddingProcessState entry.
   * Rejects with an error if the entry does not exist or the operation fails.
   */
  incrementCounts(id: string, increments: IIncrementEmbeddingProcessStateCountsSpec): Promise<IEmbeddingProcessState>;

  /**
   * Finds an EmbeddingProcessState entry by its ID.
   *
   * @param {string} id - The unique ID of the EmbeddingProcessState entry.
   * @return {Promise<IEmbeddingProcessState|null>} - A Promise that resolves to the found EmbeddingProcessState entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<IEmbeddingProcessState | null>;

  /**
   * Finds an unfinished (pending or in progress) EmbeddingProcessState entry for the given model.
   *
   * @param {string} modelId - The unique ID of the model.
   * @return {Promise<IEmbeddingProcessState|null>} - A Promise that resolves to the found EmbeddingProcessState entry or null if there is none.
   * Rejects with an error if the operation fails.
   */
  findPendingByModelId(modelId: string): Promise<IEmbeddingProcessState | null>;

  /**
   * Deletes the EmbeddingProcessState entry with the given ID.
   *
   * @param {string} id - The unique ID of the EmbeddingProcessState entry.
   * @return {Promise<void>} - A Promise that resolves when the entry has been deleted or does not exist.
   * Rejects with an error if the operation fails.
   */
  deleteById(id: string): Promise<void>;
}

export class EmbeddingProcessStateRepository implements IEmbeddingProcessStateRepository {
  public readonly Model: mongoose.Model<IEmbeddingProcessStateDoc>;

  constructor(model: mongoose.Model<IEmbeddingProcessStateDoc>) {
    this.Model = model;
  }

  async create(newSpecs: INewEmbeddingProcessStateSpec): Promise<IEmbeddingProcessState> {
    try {
      const newDoc = new this.Model({
        ...newSpecs,
      });
      await newDoc.save();
      return newDoc.toObject();
    } catch (e: unknown) {
      const err = new Error("EmbeddingProcessStateRepository.create: create failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async update(id: string, updateSpecs: IUpdateEmbeddingProcessStateSpec): Promise<IEmbeddingProcessState> {
    try {
      const doc = await this.Model.findById(id).exec();
      if (doc === null) {
        throw new Error("Update failed to find embedding process with id: " + id);
      }
      if (updateSpecs.status !== undefined) {
        doc.status = updateSpecs.status;
      }
      if (updateSpecs.embeddingServiceId !== undefined) {
        doc.embeddingServiceId = updateSpecs.embeddingServiceId;
      }
      if (updateSpecs.totalDocuments !== undefined) {
        doc.totalDocuments = updateSpecs.totalDocuments;
      }
      if (updateSpecs.errorCounts !== undefined) {
        doc.errorCounts = updateSpecs.errorCounts;
      }
      if (updateSpecs.warningCounts !== undefined) {
        doc.warningCounts = updateSpecs.warningCounts;
      }
      if (updateSpecs.completedDocuments !== undefined) {
        doc.completedDocuments = updateSpecs.completedDocuments;
      }
      await doc.save();
      return doc.toObject();
    } catch (e: unknown) {
      const err = new Error("EmbeddingProcessStateRepository.update: update failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async incrementCounts(
    id: string,
    increments: IIncrementEmbeddingProcessStateCountsSpec
  ): Promise<IEmbeddingProcessState> {
    try {
      const inc: Record<string, number> = {};
      if (increments.completedDocuments !== undefined) {
        inc.completedDocuments = increments.completedDocuments;
      }
      if (increments.errorCounts !== undefined) {
        inc.errorCounts = increments.errorCounts;
      }
      if (increments.warningCounts !== undefined) {
        inc.warningCounts = increments.warningCounts;
      }
      const doc = await this.Model.findByIdAndUpdate(id, { $inc: inc }, { new: true }).exec();
      if (doc === null) {
        throw new Error("IncrementCounts failed to find embedding process with id: " + id);
      }
      return doc.toObject();
    } catch (e: unknown) {
      const err = new Error("EmbeddingProcessStateRepository.incrementCounts: incrementCounts failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findById(id: string): Promise<IEmbeddingProcessState | null> {
    try {
      const embeddingProcessState = (await this.Model.findById(id)) as mongoose.Document<IEmbeddingProcessStateDoc>;
      return embeddingProcessState !== null ? embeddingProcessState.toObject() : null;
    } catch (e: unknown) {
      const err = new Error("EmbeddingProcessStateRepository.findById: findById failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findPendingByModelId(modelId: string): Promise<IEmbeddingProcessState | null> {
    try {
      const embeddingProcessState = await this.Model.findOne({
        modelId: { $eq: modelId },
        // Pass a bare array (not an explicit { $in: [...] }): mongoose applies $in automatically, and unlike an
        // operator object this is not rewritten by the connection's sanitizeFilter=true.
        status: [
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
          ModelInfoApiSpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.IN_PROGRESS,
        ],
      }).exec();
      return embeddingProcessState !== null ? embeddingProcessState.toObject() : null;
    } catch (e: unknown) {
      const err = new Error("EmbeddingProcessStateRepository.findPendingByModelId: findPendingByModelId failed", {
        cause: e,
      });
      console.error(err);
      throw err;
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.Model.findByIdAndDelete(id).exec();
    } catch (e: unknown) {
      const err = new Error("EmbeddingProcessStateRepository.deleteById: deleteById failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
