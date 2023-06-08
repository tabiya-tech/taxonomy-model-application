import mongoose from "mongoose";
import {randomUUID} from "crypto";
import {ISkillGroup, INewSkillGroupSpec} from "./skillGroupModel";

export interface ISkillGroupRepository {
  readonly Model: mongoose.Model<ISkillGroup>;

  /**
   * Resolves to the newly created ISkillGroup entry, or it rejects with an error if the  SkillGroup entry could not be created.
   * @param newSkillGroupSpec
   */
  create(newSkillGroupSpec: INewSkillGroupSpec): Promise<ISkillGroup>;
}

export class SkillGroupRepository implements ISkillGroupRepository {

  public readonly Model: mongoose.Model<ISkillGroup>;

  constructor(model: mongoose.Model<ISkillGroup>) {
    this.Model = model;
  }

  async create(newSkillGroupSpec: INewSkillGroupSpec): Promise<ISkillGroup> {
    //@ts-ignore
    if (newSkillGroupSpec.UUID !== undefined) {
      const e =  new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }
    try {
      const newSkillGroupModel = new this.Model({
        ...newSkillGroupSpec,
        parentGroups: [],
        UUID: randomUUID()
      });
      await newSkillGroupModel.save();
      await newSkillGroupModel.populate({path: "parentGroups"});
      await newSkillGroupModel.populate({path: "childrenGroups"});
      return newSkillGroupModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }
}
