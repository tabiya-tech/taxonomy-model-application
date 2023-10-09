import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IOccupationReferenceDoc } from "esco/occupation/occupation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IISCOGroup, IISCOGroupDoc, IISCOGroupReferenceDoc, INewISCOGroupSpec } from "./ISCOGroup.types";
import { ReferenceWithModelId } from "esco/common/objectTypes";
import { getISCOGroupReferenceWithModelId } from "./ISCOGroupReference";
import { getOccupationReferenceWithModelId } from "esco/occupation/occupationReference";

export interface IISCOGroupRepository {
  readonly Model: mongoose.Model<IISCOGroupDoc>;

  /**
   * Resolves to the newly created ISCOGroup entry, or it rejects with an error if the ISCOGroup entry could not be created.
   * @param newISCOGroupSpec
   */
  create(newISCOGroupSpec: INewISCOGroupSpec): Promise<IISCOGroup>;

  /**
   * Resolves to an array with the newly created ISCOGroup entries. If some of the documents could not be validated, they will be excluded and not saved and the function will resolve.
   * The promise will reject with an error if the ISCOGroup entries could not be created due to reasons other than not passing the validation.
   * @param newISCOGroupSpecs
   */
  createMany(newISCOGroupSpecs: INewISCOGroupSpec[]): Promise<IISCOGroup[]>;

  findById(id: string | mongoose.Types.ObjectId): Promise<IISCOGroup | null>;
}

export class ISCOGroupRepository implements IISCOGroupRepository {
  public readonly Model: mongoose.Model<IISCOGroupDoc>;

  constructor(model: mongoose.Model<IISCOGroupDoc>) {
    this.Model = model;
  }

  async create(newISCOGroupSpec: INewISCOGroupSpec): Promise<IISCOGroup> {
    //@ts-ignore
    if (newISCOGroupSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    try {
      const newISCOGroupModel = new this.Model({
        ...newISCOGroupSpec,
        UUID: randomUUID(),
      });
      await newISCOGroupModel.save();
      await newISCOGroupModel.populate([{ path: "parent" }, { path: "children" }]);
      return newISCOGroupModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(newISCOGroupSpecs: INewISCOGroupSpec[]): Promise<IISCOGroup[]> {
    try {
      const newISCOGroupModels = newISCOGroupSpecs
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
      const newISCOGroups = await this.Model.insertMany(newISCOGroupModels, {
        ordered: false,
        populate: ["parent", "children"],
      });
      return newISCOGroups.map((iscoGroup) => iscoGroup.toObject());
    } catch (e: unknown) {
      // If the error is a bulk write error, we can still return the created documents
      // Such an error will occur if a unique index is violated
      if ((e as { name?: string }).name === "MongoBulkWriteError") {
        console.warn("some documents could not be created", e);
        const bulkWriteError = e as mongoose.mongo.MongoBulkWriteError;
        const newISCOGroups: IISCOGroup[] = [];
        for await (const doc of bulkWriteError.insertedDocs) {
          await doc.populate([{ path: "parent" }, { path: "children" }]);
          newISCOGroups.push(doc.toObject());
        }
        return newISCOGroups;
      }
      console.error("batch create failed", e);
      throw e;
    }
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<IISCOGroup | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const iscoGroup = await this.Model.findById(id)
        .populate({
          path: "parent",
          populate: {
            path: "parentId",
            transform: function (doc): ReferenceWithModelId<IISCOGroupReferenceDoc> | null {
              // return only the relevant fields
              if (doc.constructor.modelName === MongooseModelName.ISCOGroup) {
                return getISCOGroupReferenceWithModelId(doc);
              }
              console.error(`Parent is not an ISCOGroup: ${doc.constructor.modelName}`);
              return null;
            },
          },
          transform: function (doc): IISCOGroupReferenceDoc | null {
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
            ): ReferenceWithModelId<IISCOGroupReferenceDoc> | ReferenceWithModelId<IOccupationReferenceDoc> | null {
              // return only the relevant fields
              if (doc.constructor.modelName === MongooseModelName.ISCOGroup) {
                return getISCOGroupReferenceWithModelId(doc);
              }
              if (doc.constructor.modelName === MongooseModelName.Occupation) {
                return getOccupationReferenceWithModelId(doc);
              }
              console.error(`Child is not an ISCOGroup or Occupation: ${doc.constructor.modelName}`);
              return null;
            },
          },
          transform: function (doc): IISCOGroupReferenceDoc | IOccupationReferenceDoc | null {
            // return only the relevant fields
            if (!doc?.childId) return null; // the child was not populated, most likely because it failed to pass the consistency criteria in the transform
            if (!doc?.childId?.modelId?.equals(doc?.modelId)) {
              console.error(`Child is not in the same model as the parent`);
              return null;
            }
            delete doc.childId.modelId;
            return doc.childId;
          },
        })
        .exec();
      return iscoGroup != null ? iscoGroup.toObject() : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      return null;
    }
  }
}
