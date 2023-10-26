import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IOccupationDoc, IOccupationReference, IOccupationReferenceDoc } from "esco/occupation/occupation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  IISCOGroup,
  IISCOGroupDoc,
  IISCOGroupReference,
  IISCOGroupReferenceDoc,
  INewISCOGroupSpec,
} from "./ISCOGroup.types";
import { getISCOGroupDocReference } from "./ISCOGroupReference";
import { getOccupationDocReference } from "esco/occupation/occupationReference";
import { IPopulatedOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";

export interface IISCOGroupRepository {
  readonly Model: mongoose.Model<IISCOGroupDoc>;

  /**
   * Creates a new ISCOGroup entry.
   *
   * @param {INewISCOGroupSpec} newISCOGroupSpec - The specification for the new ISCOGroup entry.
   * @return {Promise<IISCOGroup>} - A Promise that resolves to the newly created ISCOGroup entry.
   * Rejects with an error if the ISCOGroup entry cannot be created.
   */
  create(newISCOGroupSpec: INewISCOGroupSpec): Promise<IISCOGroup>;

  /**
   * Creates multiple new ISCOGroup entries.
   *
   * @param {INewISCOGroupSpec[]} newISCOGroupSpecs - An array of specifications for the new ISCOGroup entries.
   * @return {Promise<IISCOGroup[]>} - A Promise that resolves to an array containing the newly created ISCOGroup entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newISCOGroupSpecs: INewISCOGroupSpec[]): Promise<IISCOGroup[]>;

  /**
   * Finds a ISCOGroup entry by its ID.
   *
   * @param {string} id - The unique ID of the ISCOGroup entry to find.
   * @return {Promise<IISCOGroup|null>} - A Promise that resolves to the found ISCOGroup entry or null if not found.
   * Rejects with an error if the operation fails.
   */
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
            transform: function (doc: unknown): IISCOGroupReferenceDoc | null {
              // return only the relevant fields
              const modelName = (doc as ModelConstructed<unknown>).constructor.modelName;
              if (modelName === MongooseModelName.ISCOGroup) {
                return getISCOGroupDocReference(doc as ISCOGroupDocument);
              }
              console.error(`Parent is not an ISCOGroup: ${modelName}`);
              return null;
            },
          },
          transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IISCOGroupReference | null {
            // return only the relevant fields
            if (!doc.parentId) return null; // the parent was not populated, most likely because it failed to pass the consistency criteria in the transform
            if (!doc.parentId.modelId?.equals(doc.modelId)) {
              console.error(`Parent is not in the same model as the child`);
              return null;
            }
            // @ts-ignore - we want to remove the modelId field because  it is not part of the IISCOGroupReferenceDoc interface
            delete doc.parentId.modelId;
            return doc.parentId as IISCOGroupReference;
          },
        })
        .populate({
          path: "children",
          populate: {
            path: "childId",
            transform: function (doc: unknown): IISCOGroupReferenceDoc | IOccupationReferenceDoc | null {
              // return only the relevant fields
              const modelName = (doc as ModelConstructed<unknown>).constructor.modelName;
              if (modelName === MongooseModelName.Occupation) {
                return getOccupationDocReference(doc as OccupationDocument);
              }
              if (modelName === MongooseModelName.ISCOGroup) {
                return getISCOGroupDocReference(doc as ISCOGroupDocument);
              }
              console.error(`Child is not an ISCOGroup or Occupation: ${modelName}`);
              return null;
            },
          },
          transform: function (
            doc: IPopulatedOccupationHierarchyPairDoc
          ): IISCOGroupReference | IOccupationReference | null {
            // return only the relevant fields
            if (!doc.childId) return null; // the child was not populated, most likely because it failed to pass the consistency criteria in the transform
            if (!doc.childId.modelId?.equals(doc.modelId)) {
              console.error(`Child is not in the same model as the parent`);
              return null;
            }
            // @ts-ignore - we want to remove the modelId field because  it is not part of the IISCOGroupReference | IOccupationReference interface
            delete doc.childId.modelId;
            return doc.childId;
          },
        })
        .exec();
      return iscoGroup ? iscoGroup.toObject() : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      throw e;
    }
  }
}

type ModelConstructed<T> = { constructor: mongoose.Model<T> };
type _Document<T> = mongoose.Document<unknown, undefined, T> & T & ModelConstructed<T>;
type ISCOGroupDocument = _Document<IISCOGroupDoc>;
type OccupationDocument = _Document<IOccupationDoc>;
