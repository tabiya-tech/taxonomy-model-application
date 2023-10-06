import mongoose from "mongoose";
import { randomUUID } from "crypto";
import {
  INewOccupationSpec,
  IOccupation,
  IOccupationDoc,
  IOccupationReferenceDoc,
} from "./occupation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ReferenceWithModelId } from "esco/common/objectTypes";
import { IISCOGroupReferenceDoc } from "esco/iscoGroup/ISCOGroup.types";
import { getOccupationReferenceWithModelId } from "./occupationReference";
import { getISCOGroupReferenceWithModelId } from "esco/iscoGroup/ISCOGroupReference";

export interface IOccupationRepository {
  readonly Model: mongoose.Model<IOccupationDoc>;

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
  createMany(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]>;

  findById(id: string): Promise<IOccupation | null>;
}

export class OccupationRepository implements IOccupationRepository {
  public readonly Model: mongoose.Model<IOccupationDoc>;

  constructor(model: mongoose.Model<IOccupationDoc>) {
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
        UUID: randomUUID(),
      });
      await newOccupationModel.save();
      await newOccupationModel.populate([
        { path: "parent" },
        { path: "children" },
      ]);
      return newOccupationModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(
    newOccupationSpecs: INewOccupationSpec[]
  ): Promise<IOccupation[]> {
    try {
      const newOccupationModels = newOccupationSpecs
        .map((spec) => {
          try {
            return new this.Model({
              ...spec,
              UUID: randomUUID(), // override UUID silently
            });
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const newOccupations = await this.Model.insertMany(newOccupationModels, {
        ordered: false,
        populate: [{ path: "parent" }, { path: "children" }],
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
          await doc.populate([{ path: "parent" }, { path: "children" }]);
          newOccupations.push(doc.toObject());
        }
        return newOccupations;
      }
      console.error("batch create failed", e);
      throw e;
    }
  }

  async findById(
    id: string | mongoose.Types.ObjectId
  ): Promise<IOccupation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const occupation = await this.Model.findById(id)
        .populate({
          path: "parent",
          populate: {
            path: "parentId",
            transform: function (
              doc
            ):
              | ReferenceWithModelId<IISCOGroupReferenceDoc>
              | ReferenceWithModelId<IOccupationReferenceDoc>
              | null {
              // return only the relevant fields
              if (doc.constructor.modelName === MongooseModelName.ISCOGroup) {
                return getISCOGroupReferenceWithModelId(doc);
              }
              if (doc.constructor.modelName === MongooseModelName.Occupation) {
                return getOccupationReferenceWithModelId(doc);
              }
              console.error(
                `Parent is not an ISCOGroup or an Occupation: ${doc.constructor.modelName}`
              );
              return null;
            },
          },
          transform: function (
            doc
          ): IISCOGroupReferenceDoc | IOccupationReferenceDoc | null {
            // return only the relevant fields
            if (!doc?.parentId) return null; // the parent was not populated, most likely because it failed to pass the consistency criteria in the transform

            if (!doc?.parentId?.modelId?.equals(doc?.modelId)) {
              console.error(`Parent is not in the same model as the child`);
              return null;
            }
            delete doc.parentId.modelId;
            return doc.parentId;
          },
        })
        .populate({
          path: "children",
          populate: {
            path: "childId",
            transform: function (
              doc
            ): ReferenceWithModelId<IOccupationReferenceDoc> | null {
              // return only the relevant fields
              if (doc.constructor.modelName === MongooseModelName.Occupation) {
                return getOccupationReferenceWithModelId(doc);
              }
              console.error(
                `Child is not an Occupation: ${doc.constructor.modelName}`
              );
              return null;
            },
          },
          transform: function (doc): IOccupationReferenceDoc | null {
            // return only the relevant fields
            if (!doc?.childId) return null; // the child was not populated, most likely because it failed to pass the consistency criteria in the transform
            if (!doc?.childId?.modelId?.equals(doc.modelId)) {
              console.error(`Child is not in the same model as the parent`);
              return null;
            }
            delete doc.childId.modelId;
            return doc.childId;
          },
        })
        .exec();
      return occupation != null ? occupation.toObject() : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      return null;
    }
  }
}
