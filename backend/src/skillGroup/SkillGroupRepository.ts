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
    try {
      //@ts-ignore
      if (newSkillGroupSpec.UUID !== undefined) {
        throw new Error("UUID should not be provided");
      }
      const newSkillGroupModel = new this.Model({
        ...newSkillGroupSpec,
        parentGroups: [],
        UUID: randomUUID()
      });
      await newSkillGroupModel.save();
      await newSkillGroupModel.populate({path: "parentGroups"});
      await newSkillGroupModel.populate({path:"childrenGroups"});
      return newSkillGroupModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }
}
