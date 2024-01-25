import mongoose from "mongoose";
import {
  IExportProcessState,
  IExportProcessStateDoc,
  INewExportProcessStateSpec,
  IUpdateExportProcessStateSpec,
} from "./exportProcessState.types";

export interface IExportProcessStateRepository {
  readonly Model: mongoose.Model<IExportProcessStateDoc>;

  /**
   * Creates a new ExportProcessState entry.
   *
   * @param {INewExportProcessStateSpec} newSpecs - The specification for the new ExportProcessState entry.
   * @return {Promise<IExportProcessState>} - A Promise that resolves to the newly created ExportProcessState entry.
   * Rejects with an error if the ExportProcessState entry cannot be created.
   */
  create(newSpecs: INewExportProcessStateSpec): Promise<IExportProcessState>;

  /**
   * Updates the ExportProcessState entry with the given ID.
   *
   * @param {string} id - The unique ID of the ExportProcessState entry.
   * @param {IUpdateExportProcessStateSpec} updateSpecs - The specification to update with
   * @return {Promise<IExportProcessState>} - A Promise that resolves to the updated ExportProcessState entry.
   * Rejects with an error if the ExportProcessState entry cannot be updated.
   */
  update(id: string, updateSpecs: IUpdateExportProcessStateSpec): Promise<IExportProcessState>;

  /**
   * Finds an ExportProcessState entry by its ID.
   *
   * @param {string} id - The unique ID of the ExportProcessState entry.
   * @return {Promise<IExportProcessState|null>} - A Promise that resolves to the found ExportProcessState entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<IExportProcessState | null>;
}

export class ExportProcessStateRepository implements IExportProcessStateRepository {
  public readonly Model: mongoose.Model<IExportProcessStateDoc>;

  constructor(model: mongoose.Model<IExportProcessStateDoc>) {
    this.Model = model;
  }

  async create(newSpecs: INewExportProcessStateSpec): Promise<IExportProcessState> {
    try {
      const newDoc = new this.Model({
        ...newSpecs,
      });
      await newDoc.save();
      return newDoc.toObject();
    } catch (e: unknown) {
      const err = new Error("ExportProcessStateRepository.create: create failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async update(id: string, updateSpecs: IUpdateExportProcessStateSpec): Promise<IExportProcessState> {
    try {
      const doc = await this.Model.findById(id).exec();
      if (doc === null) {
        throw new Error("Update failed to find export process with id: " + id);
      }
      if (updateSpecs.status) {
        doc.status = updateSpecs.status;
      }
      if (updateSpecs.result) {
        doc.result = updateSpecs.result;
      }
      if (updateSpecs.downloadUrl) {
        doc.downloadUrl = updateSpecs.downloadUrl;
      }
      if (updateSpecs.timestamp) {
        doc.timestamp = updateSpecs.timestamp;
      }
      await doc.save();
      return doc.toObject();
    } catch (e: unknown) {
      const err = new Error("ExportProcessStateRepository.update: update failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findById(id: string): Promise<IExportProcessState | null> {
    try {
      const exportProcessState = (await this.Model.findById(id)) as mongoose.Document<IExportProcessStateDoc>;
      return exportProcessState !== null ? exportProcessState.toObject() : null;
    } catch (e: unknown) {
      const err = new Error("ExportProcessStateRepository.findById: findById failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
