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

  /**
   * Resolves to an array with the newly created ISkillGroup entries. If some of the documents could not be validated, they will be excluded and not saved and the function will resolve.
   * The promise will reject with an error if the ISkillGroup entries could not be created due to reasons other than not passing the validation.
   * @param newSkillGroupSpecs
   */
  batchCreate(newSkillGroupSpecs: INewSkillGroupSpec[]): Promise<ISkillGroup[]>;
}

export class SkillGroupRepository implements ISkillGroupRepository {

  public readonly Model: mongoose.Model<ISkillGroup>;

  constructor(model: mongoose.Model<ISkillGroup>) {
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

  async batchCreate(newSkillGroupSpecs: INewSkillGroupSpec[]): Promise<ISkillGroup[]> {
    try {
      const newSkillGroupModels = newSkillGroupSpecs.map((spec) => {
        return new this.Model({
          ...spec,
          parentGroups: [],
          UUID: randomUUID() // override UUID silently
        });
      });
      const newSkillGroups = await this.Model.insertMany(newSkillGroupModels, {
        ordered: false,
        populate: ["parentGroups", "childrenGroups"]
      });
      return newSkillGroups.map((skillGroup) => skillGroup.toObject());
    } catch (e: unknown) {
      console.error("batch create failed", e);
      throw e;
    }
  }
}
