import mongoose from "mongoose";
import { randomUUID } from "crypto";
import {
  INewSkillGroupSpec,
  ISkillGroup,
  ISkillGroupDoc,
  ISkillGroupReference,
  ISkillGroupReferenceDoc,
} from "./skillGroup.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getSkillGroupDocReferenceWithModelId } from "./skillGroupReference";
import { getSkillReferenceWithModelId } from "esco/skill/skillReference";
import { ISkillDoc, ISkillReference, ISkillReferenceDoc } from "esco/skill/skills.types";
import { IPopulatedSkillHierarchyPairDoc } from "esco/skillHierarchy/skillHierarchy.types";

export interface ISkillGroupRepository {
  readonly Model: mongoose.Model<ISkillGroupDoc>;

  /**
   * Creates a new SkillGroup entry.
   *
   * @param {INewSkillGroupSpec} newSkillGroupSpec - The specification for the new SkillGroup entry.
   * @return {Promise<ISkillGroup>} - A Promise that resolves to the newly created ISkillGroup entry.
   * Rejects with an error if the SkillGroup entry cannot be created.
   */

  create(newSkillGroupSpec: INewSkillGroupSpec): Promise<ISkillGroup>;

  /**
   * Creates multiple new SkillGroup entries.
   *
   * @param {INewSkillGroupSpec[]} newSkillGroupSpecs - An array of specifications for the new SkillGroup entries.
   * @return {Promise<ISkillGroup[]>} - A Promise that resolves to an array containing the newly created ISkillGroup entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newSkillGroupSpecs: INewSkillGroupSpec[]): Promise<ISkillGroup[]>;

  /**
   * Finds a SkillGroup entry by its ID.
   *
   * @param {string} id - The unique ID of the SkillGroup entry to find.
   * @return {Promise<ISkillGroup|null>} - A Promise that resolves to the found SkillGroup entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<ISkillGroup | null>;
}

export class SkillGroupRepository implements ISkillGroupRepository {
  public readonly Model: mongoose.Model<ISkillGroupDoc>;

  constructor(model: mongoose.Model<ISkillGroupDoc>) {
    this.Model = model;
  }

  async create(newSkillGroupSpec: INewSkillGroupSpec): Promise<ISkillGroup> {
    //@ts-ignore
    if (newSkillGroupSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    try {
      const newSkillGroupModel = new this.Model({
        ...newSkillGroupSpec,
        UUID: randomUUID(),
      });
      await newSkillGroupModel.save();
      await newSkillGroupModel.populate([{ path: "parents" }, { path: "children" }]);
      return newSkillGroupModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(newSkillGroupSpecs: INewSkillGroupSpec[]): Promise<ISkillGroup[]> {
    try {
      const newSkillGroupModels = newSkillGroupSpecs
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
      const newSkillGroups = await this.Model.insertMany(newSkillGroupModels, {
        ordered: false,
        populate: ["parents", "children"],
      });
      return newSkillGroups.map((skillGroup) => skillGroup.toObject());
    } catch (e: unknown) {
      // If the error is a bulk write error, we can still return the created documents
      // Such an error will occur if a unique index is violated
      if ((e as { name?: string }).name === "MongoBulkWriteError") {
        console.warn("some documents could not be created", e);
        const bulkWriteError = e as mongoose.mongo.MongoBulkWriteError;
        const newSkillGroups: ISkillGroup[] = [];
        for await (const doc of bulkWriteError.insertedDocs) {
          await doc.populate("parents");
          await doc.populate("children");
          newSkillGroups.push(doc.toObject());
        }
        return newSkillGroups;
      }
      console.error("batch create failed", e);
      throw e;
    }
  }

  async findById(id: string): Promise<ISkillGroup | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const skillGroup = await this.Model.findById(id)
        .populate({
          path: "parents",
          populate: {
            path: "parentId",
            transform: function (doc: unknown): ISkillGroupReferenceDoc | null {
              // return only the relevant fields
              const modelName = (doc as ModelConstructed<unknown>).constructor.modelName;
              if (modelName === MongooseModelName.SkillGroup) {
                return getSkillGroupDocReferenceWithModelId(doc as SkillGroupDocument);
              }
              console.error(`Parent is not a SkillGroup: ${modelName}`);
              return null;
            },
          },
          transform: function (doc: IPopulatedSkillHierarchyPairDoc): ISkillReference | ISkillGroupReference | null {
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
            transform: function (doc: unknown): ISkillReferenceDoc | ISkillGroupReferenceDoc | null {
              const modelName = (doc as ModelConstructed<unknown>).constructor.modelName;
              if (modelName === MongooseModelName.Skill) {
                return getSkillReferenceWithModelId(doc as SkillDocument);
              }
              if (modelName === MongooseModelName.SkillGroup) {
                return getSkillGroupDocReferenceWithModelId(doc as SkillGroupDocument);
              }
              // @ts-ignore
              console.error(`Child is not a SkillGroup or Skill: ${modelName}`);
              return null;
            },
          },
          transform: (doc: IPopulatedSkillHierarchyPairDoc): ISkillReference | ISkillGroupReference | null => {
            if (!doc.childId) return null;
            if (!doc.childId.modelId?.equals(doc.modelId)) {
              console.error(`Child is not in the same model as the parent`);
              return null;
            }
            // @ts-ignore - we want to remove the modelId field because it is not part of the ISkillReferenceDoc | ISkillGroupReferenceDoc interface
            delete doc.childId.modelId;
            return doc.childId;
          },
        })
        .exec();
      return skillGroup != null ? skillGroup.toObject() : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      throw e;
    }
  }
}

type ModelConstructed<T> = { constructor: mongoose.Model<T> };
type _Document<T> = mongoose.Document<unknown, undefined, T> & T & ModelConstructed<T>;
type SkillDocument = _Document<ISkillDoc>;
type SkillGroupDocument = _Document<ISkillGroupDoc>;
