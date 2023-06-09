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
}
