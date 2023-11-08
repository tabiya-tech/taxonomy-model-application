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
      console.error("create failed", e);
      throw e;
    }
  }

  async update(id: string, updateSpecs: IUpdateExportProcessStateSpec): Promise<IExportProcessState> {
    try {
      const updateResult = await this.Model.updateOne({ _id: id }, updateSpecs).exec();
      if (!updateResult.modifiedCount) {
        throw new Error("Update failed to find export process with id: " + id);
      }
      const exportProcessState = (await this.Model.findById(id)) as mongoose.Document<IExportProcessStateDoc>;
      return exportProcessState.toObject();
    } catch (e: unknown) {
      console.error("update failed", e);
      throw e;
    }
  }
}
