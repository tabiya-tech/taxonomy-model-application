import mongoose from "mongoose";
import { randomUUID } from "crypto";
import {
  INewOccupationSpec,
  IOccupation,
  IOccupationDoc,
  IOccupationReference,
  IOccupationReferenceDoc,
} from "./occupation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IISCOGroupDoc, IISCOGroupReference, IISCOGroupReferenceDoc } from "esco/iscoGroup/ISCOGroup.types";
import { getOccupationDocReference } from "./occupationReference";
import { getISCOGroupDocReference } from "esco/iscoGroup/ISCOGroupReference";
import { IPopulatedOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";

export interface IOccupationRepository {
  readonly Model: mongoose.Model<IOccupationDoc>;

  /**
   * Creates a new Occupation entry.
   *
   * @param {INewOccupationSpec} newOccupationSpec - The specification for the new Occupation entry.
   * @return {Promise<IOccupation>} - A Promise that resolves to the newly created Occupation entry.
   * Rejects with an error if the Occupation entry cannot be created ue to reasons other than validation.
   */
  create(newOccupationSpec: INewOccupationSpec): Promise<IOccupation>;

  /**
   * Creates multiple new Occupation entries.
   *
   * @param {INewOccupationSpec[]} newOccupationSpecs - An array of specifications for the new Occupation entries.
   * @return {Promise<IOccupation[]>} - A Promise that resolves to an array containing the newly created Occupation entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]>;

  /**
   * Finds an Occupation entry by its ID.
   *
   * @param {string} id - The unique ID of the Occupation entry.
   * @return {Promise<IOccupation|null>} - A Promise that resolves to the found Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
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
      await newOccupationModel.populate([{ path: "parent" }, { path: "children" }]);
      return newOccupationModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]> {
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

  async findById(id: string | mongoose.Types.ObjectId): Promise<IOccupation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const occupation = await this.Model.findById(id)
        .populate({
          path: "parent",
          populate: {
            path: "parentId",
            transform: function (doc: unknown): IISCOGroupReferenceDoc | IOccupationReferenceDoc | null {
              // return only the relevant fields
              const modelName = (doc as ModelConstructed<unknown>).constructor.modelName;
              if (modelName === MongooseModelName.ISCOGroup) {
                return getISCOGroupDocReference(doc as ISCOGroupDocument);
              }
              if (modelName === MongooseModelName.Occupation) {
                return getOccupationDocReference(doc as OccupationDocument);
              }
              console.error(`Parent is not an ISCOGroup or an Occupation: ${modelName}`);
              return null;
            },
          },
          transform: function (
            doc: IPopulatedOccupationHierarchyPairDoc
          ): IISCOGroupReference | IOccupationReference | null {
            // return only the relevant fields
            if (!doc.parentId) return null; // the parent was not populated, most likely because it failed to pass the consistency criteria in the transform
            if (!doc.parentId.modelId?.equals(doc.modelId)) {
              console.error(`Parent is not in the same model as the child`);
              return null;
            }
            // @ts-ignore - we want to remove the modelId field because  it is not part of the IISCOGroupReferenceDoc interface
            delete doc.parentId.modelId;
            return doc.parentId;
          },
        })
        .populate({
          path: "children",
          populate: {
            path: "childId",
            transform: function (doc: unknown): IOccupationReferenceDoc | null {
              // return only the relevant fields
              const modelName = (doc as ModelConstructed<unknown>).constructor.modelName;
              if (modelName === MongooseModelName.Occupation) {
                return getOccupationDocReference(doc as OccupationDocument);
              }
              console.error(`Child is not an Occupation: ${modelName}`);
              return null;
            },
          },
          transform: function (doc: IPopulatedOccupationHierarchyPairDoc): IOccupationReference | null {
            // return only the relevant fields
            if (!doc.childId) return null; // the child was not populated, most likely because it failed to pass the consistency criteria in the transform
            if (!doc.childId.modelId?.equals(doc.modelId)) {
              console.error(`Child is not in the same model as the parent`);
              return null;
            }
            // @ts-ignore - we want to remove the modelId field because it is not part of the IOccupationReference interface
            delete doc.childId.modelId;
            return doc.childId as IOccupationReference;
          },
        })
        .exec();
      return occupation != null ? occupation.toObject() : null;
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
