import mongoose from "mongoose";
import {IOccupation, INewOccupationSpec} from "./occupationModel";
import {randomUUID} from "crypto";

export interface IOccupationRepository {
  readonly Model: mongoose.Model<IOccupation>;

  /**
   * Resolves to the newly created Occupation entry, or it rejects with an error if the Occupation entry could not be created.
   * @param newOccupationSpec
   */
  create(newOccupationSpec: INewOccupationSpec): Promise<IOccupation>;

  /**
   * Resolves to an array with the newly created Occupation entries. If some of the documents could not be validated, they will be excluded and not saved and the function will resolve.
   * The promise will reject with an error if the Occupation entries could not be created due to reasons other than not passing the validation.
   * @param newOccupationSpecs
   */
  batchCreate(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]>
}

export class OccupationRepository implements IOccupationRepository {

  public readonly Model: mongoose.Model<IOccupation>;

  constructor(model: mongoose.Model<IOccupation>) {
    this.Model = model;
  }

  async create(newOccupationSpec: INewOccupationSpec): Promise<IOccupation> {
    //@ts-ignore
    if (newOccupationSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    try {
      const newOccupationModel = new this.Model({
        ...newOccupationSpec,
        UUID: randomUUID()
      });
      await newOccupationModel.save();
      return newOccupationModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async batchCreate(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]> {
    try {
      const newOccupationModels = newOccupationSpecs.map((spec) => {
        return new this.Model({
          ...spec,
          UUID: randomUUID() // override UUID silently
        });
      });
      const newOccupations = await this.Model.insertMany(newOccupationModels, {
        ordered: false,
      });
      return newOccupations.map((Occupation) => Occupation.toObject());
    } catch (e: unknown) {
      // If the error is a bulk write error, we can still return the created documents
      // Such an error will occur if a unique index is violated
      if ((e as { name?: string }).name === "MongoBulkWriteError") {
        console.warn("some documents could not be created", e);
        const bulkWriteError = e as mongoose.mongo.MongoBulkWriteError;
        const newOccupations: IOccupation[] = [];
        for await (const doc of bulkWriteError.insertedDocs) {
          newOccupations.push(doc.toObject());
        }
        return newOccupations;
      }
      console.error("batch create failed", e);
      throw e;
    }
  }
}