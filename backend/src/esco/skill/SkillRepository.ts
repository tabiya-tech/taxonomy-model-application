import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewSkillSpec, ISkill, ISkillDoc, ISkillReferenceDoc } from "./skills.types";
import { ReferenceWithModelId } from "../common/objectTypes";
import { MongooseModelName } from "../common/mongooseModelNames";
import { getSkillReferenceWithModelId } from "./skillReference";
import { getSkillGroupReferenceWithModelId } from "../skillGroup/skillGroupReference";
import { ISkillGroupReferenceDoc } from "../skillGroup/skillGroup.types";

export interface ISkillRepository {
  readonly Model: mongoose.Model<ISkillDoc>;

  /**
   * Resolves to the newly created ISkill entry, or it rejects with an error if the  Skill entry could not be created.
   * @param newSkillSpec
   */
  create(newSkillSpec: INewSkillSpec): Promise<ISkill>;

  /**
   * Resolves to an array with the newly created ISkill entries. If some of the documents could not be validated, they will be excluded and not saved and the function will resolve.
   * The promise will reject with an error if the ISkill entries could not be created due to reasons other than not passing the validation.
   * @param newSkillSpecs
   */
  createMany(newSkillSpecs: INewSkillSpec[]): Promise<ISkill[]>;

  /**
   * Resolves to the ISkill entry with the given id, or it resolves to null if no ISkill entry with the given id exists.
   * @param id
   */

  findById(id: string): Promise<ISkill | null>;
}

export class SkillRepository implements ISkillRepository {
  public readonly Model: mongoose.Model<ISkillDoc>;

  constructor(model: mongoose.Model<ISkillDoc>) {
    this.Model = model;
  }

  async create(newSkillSpec: INewSkillSpec): Promise<ISkill> {
    //@ts-ignore
    if (newSkillSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    try {
      const newSkillModel = new this.Model({
        ...newSkillSpec,
        UUID: randomUUID(),
      });
      await newSkillModel.save();
      await newSkillModel.populate([{ path: "parents" }, { path: "children" }]);
      return newSkillModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(newSkillSpecs: INewSkillSpec[]): Promise<ISkill[]> {
    try {
      const newSkillModels = newSkillSpecs
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
      const newSkills = await this.Model.insertMany(newSkillModels, {
        ordered: false,
        populate: ["parents", "children"], // Populate parents and children fields
      });
      return newSkills.map((skill) => skill.toObject());
    } catch (e: unknown) {
      // If the error is a bulk write error, we can still return the created documents
      // Such an error will occur if a unique index is violated
      if ((e as { name?: string }).name === "MongoBulkWriteError") {
        console.warn("some documents could not be created", e);
        const bulkWriteError = e as mongoose.mongo.MongoBulkWriteError;
        const newSkills: ISkill[] = [];
        for await (const doc of bulkWriteError.insertedDocs) {
          await doc.populate([{ path: "parents" }, { path: "children" }]); // Populate parents and children fields
          newSkills.push(doc.toObject());
        }
        return newSkills;
      }
      console.error("batch create failed", e);
      throw e;
    }
  }

  async findById(id: string): Promise<ISkill | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const skill = await this.Model.findById(id)
        .populate({
          path: "parents",
          populate: {
            path: "parentId",
            transform: function (
              doc
            ): ReferenceWithModelId<ISkillReferenceDoc> | ReferenceWithModelId<ISkillGroupReferenceDoc> | null {
              if (doc.constructor.modelName === MongooseModelName.Skill) {
                return getSkillReferenceWithModelId(doc);
              }
              if (doc.constructor.modelName === MongooseModelName.SkillGroup) {
                return getSkillGroupReferenceWithModelId(doc);
              }
              console.error(`Parent is not a Skill or SkillGroup: ${doc.constructor.modelName}`);
              return null;
            },
          },
          transform: function (doc): ISkillReferenceDoc | null {
            if (!doc?.parentId) return null;
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
            ): ReferenceWithModelId<ISkillReferenceDoc> | ReferenceWithModelId<ISkillGroupReferenceDoc> | null {
              // return only the relevant fields
              if (doc.constructor.modelName === MongooseModelName.Skill) {
                return getSkillReferenceWithModelId(doc);
              }
              if (doc.constructor.modelName === MongooseModelName.SkillGroup) {
                return getSkillGroupReferenceWithModelId(doc);
              }
              console.error(`Child is not a Skill or SkillGroup: ${doc.constructor.modelName}`);
              return null;
            },
          },
          transform: function (doc): ISkillReferenceDoc | null {
            // return only the relevant fields
            if (!doc?.childId) return null;
            if (!doc?.childId?.modelId?.equals(doc?.modelId)) {
              console.error(`Child is not in the same model as the parent`);
              return null;
            }
            delete doc.childId.modelId;
            return doc.childId;
          },
        })
        .exec();

      return skill ? skill.toObject() : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      throw e;
    }
  }
}
