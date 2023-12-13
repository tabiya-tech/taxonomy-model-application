import mongoose from "mongoose";
import {
  IImportProcessState,
  IImportProcessStateDoc,
  INewImportProcessStateSpec,
  IUpdateImportProcessStateSpec,
} from "./importProcessState.types";

export interface IImportProcessStateRepository {
  readonly Model: mongoose.Model<IImportProcessStateDoc>;

  /**
   * Creates a new ImportProcessState entry.
   *
   * @param {INewImportProcessStateSpec} newSpecs - The specification for the new ImportProcessState entry.
   * @return {Promise<IImportProcessState>} - A Promise that resolves to the newly created ImportProcessState entry.
   * Rejects with an error if the ImportProcessState entry cannot be created.
   */
  create(newSpecs: INewImportProcessStateSpec): Promise<IImportProcessState>;

  /**
   * Updates the ImportProcessState entry with the given ID.
   *
   * @param {string} id - The unique ID of the ImportProcessState entry.
   * @param {IUpdateImportProcessStateSpec} updateSpecs - The specification to update with
   * @return {Promise<IImportProcessState>} - A Promise that resolves to the updated ImportProcessState entry.
   * Rejects with an error if the ImportProcessState entry cannot be updated.
   */
  update(id: string, updateSpecs: IUpdateImportProcessStateSpec): Promise<IImportProcessState>;
}

export class ImportProcessStateRepository implements IImportProcessStateRepository {
  public readonly Model: mongoose.Model<IImportProcessStateDoc>;

  constructor(model: mongoose.Model<IImportProcessStateDoc>) {
    this.Model = model;
  }

  async create(newSpecs: INewImportProcessStateSpec): Promise<IImportProcessState> {
    try {
      const newDoc = new this.Model({
        ...newSpecs,
        _id: newSpecs.id,
      });
      await newDoc.save();
      return newDoc.toObject();
    } catch (e: unknown) {
      console.error(new Error("create failed", { cause: e }));
      throw e;
    }
  }

  async update(id: string, updateSpecs: IUpdateImportProcessStateSpec): Promise<IImportProcessState> {
    try {
      let doc = null;
      doc = await this.Model.findById(id).exec();
      if (doc === null) {
        throw new Error("Update failed to find import process with id: " + id);
      }
      if (updateSpecs.status !== undefined) {
        doc.status = updateSpecs.status;
      }
      if (updateSpecs.result !== undefined) {
        doc.result = updateSpecs.result;
      }
      await doc.save();
      return doc.toObject();
    } catch (e: unknown) {
      console.error(new Error("update failed", { cause: e }));
      throw e;
    }
  }
}
