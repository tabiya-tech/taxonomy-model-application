import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewSkillGroupSpec, ISkillGroup, ISkillGroupDoc, ISkillGroupReferenceDoc } from "./skillGroup.types";
import { ReferenceWithModelId } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { getSkillGroupReferenceWithModelId } from "./skillGroupReference";
import { getSkillReferenceWithModelId } from "esco/skill/skillReference";
import { ISkillReferenceDoc } from "esco/skill/skills.types";

export interface ISkillGroupRepository {
  readonly Model: mongoose.Model<ISkillGroupDoc>;

  /**
   * Resolves to the newly created ISkillGroup entry, or it rejects with an error if the  SkillGroup entry could not be created.
   * @param newSkillGroupSpec
   */
  create(newSkillGroupSpec: INewSkillGroupSpec): Promise<ISkillGroup>;

  /**
   * Resolves to an array with the newly created ISkillGroup entries. If some of the documents could not be validated, they will be excluded and not saved and the function will resolve.
   * The promise will reject with an error if the ISkillGroup entries could not be created due to reasons other than not passing the validation.
   * @param newSkillGroupSpecs
   */
  createMany(newSkillGroupSpecs: INewSkillGroupSpec[]): Promise<ISkillGroup[]>;

  /**
   * Resolves to the ISkillGroup entry with the given id, or it resolves to null if no ISkillGroup entry with the given id exists.
   * @param id
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
            transform: function (doc): ReferenceWithModelId<ISkillGroupReferenceDoc> | null {
              // return only the relevant fields
              if (doc.constructor.modelName === MongooseModelName.SkillGroup) {
                return getSkillGroupReferenceWithModelId(doc);
              }
              console.error(`Parent is not a SkillGroup: ${doc.constructor.modelName}`);
              return null;
            },
          },
          transform: function (doc): ISkillGroupReferenceDoc | null {
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
            ): ReferenceWithModelId<ISkillGroupReferenceDoc> | ReferenceWithModelId<ISkillReferenceDoc> | null {
              // return only the relevant fields
              if (doc.constructor.modelName === MongooseModelName.SkillGroup) {
                return getSkillGroupReferenceWithModelId(doc);
              }
              if (doc.constructor.modelName === MongooseModelName.Skill) {
                return getSkillReferenceWithModelId(doc);
              }
              console.error(`Child is not a SkillGroup or Skill: ${doc.constructor.modelName}`);
              return null;
            },
          },
          transform: function (doc): ISkillGroupReferenceDoc | ISkillReferenceDoc | null {
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
      return skillGroup != null ? skillGroup.toObject() : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      throw e;
    }
  }
}
