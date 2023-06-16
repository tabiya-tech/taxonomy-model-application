import mongoose from "mongoose";
import {ISkill, INewSkillSpec} from "./skillModel";
import {randomUUID} from "crypto";

export interface ISkillRepository {
  readonly Model: mongoose.Model<ISkill>;

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
  batchCreate(newSkillSpecs: INewSkillSpec[]): Promise<ISkill[]>
}

export class SkillRepository implements ISkillRepository {

  public readonly Model: mongoose.Model<ISkill>;

  constructor(model: mongoose.Model<ISkill>) {
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

  async batchCreate(newSkillSpecs: INewSkillSpec[]): Promise<ISkill[]> {
    try {
      const newSkillModels = newSkillSpecs.map((spec) => {
        return new this.Model({
          ...spec,
          UUID: randomUUID() // override UUID silently
        });
      });
      const newSkills = await this.Model.insertMany(newSkillModels, {
        ordered: false,
        populate: ["parentGroup", "childrenGroups"]
      });
      return newSkills.map((skill) => skill.toObject());
    } catch (e: unknown) {
      console.error("batch create failed", e);
      throw e;
    }
  }
}
