import mongoose from "mongoose";
import {randomUUID} from "crypto";
import {INewSkillSpec, ISkill, ISkillDoc} from "./skills.types";

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
  createMany(newSkillSpecs: INewSkillSpec[]): Promise<ISkill[]>
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
        UUID: randomUUID()
      });
      await newSkillModel.save();
      return newSkillModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(newSkillSpecs: INewSkillSpec[]): Promise<ISkill[]> {
    try {
      const newSkillModels = newSkillSpecs.map((spec) => {
        try {
          return new this.Model({
            ...spec,
            UUID: randomUUID() // override UUID silently
          });
        } catch (e: unknown) {
          return null;
        }
      }).filter(Boolean);
      const newSkills = await this.Model.insertMany(newSkillModels, {
        ordered: false
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
          newSkills.push(doc.toObject());
        }
        return newSkills;
      }
      console.error("batch create failed", e);
      throw e;
    }
  }
}