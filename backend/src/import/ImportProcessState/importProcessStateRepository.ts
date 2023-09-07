import mongoose from "mongoose";
import {
  IImportProcessState,
  IImportProcessStateDoc,
  INewImportProcessStateSpec,
  IUpdateImportProcessStateSpec
} from "./importProcessState.types";

export interface IImportProcessStateRepository {
  readonly Model: mongoose.Model<IImportProcessStateDoc>;

  /**
   * Resolves to the newly created IImportProcessState entry, or it rejects with an error if the ImportProcessState entry could not be created.
   * @param newSpecs
   */
  create(newSpecs: INewImportProcessStateSpec): Promise<IImportProcessState>;

  /**
   * Updates the ImportProcessState entry with the given id and resolves to the updated entry, or it rejects with an error if the ImportProcessState entry could not be updated.
   * @param id
   * @param updateSpecs
   */
  update(id: string, updateSpecs: IUpdateImportProcessStateSpec): Promise<IImportProcessState>
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
        _id: newSpecs.id
      });
      await newDoc.save();
      return newDoc.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
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
      await doc.save();
      return doc.toObject();
    } catch (e: unknown) {
      console.error("update failed", e);
      throw e;
    }
  }
}