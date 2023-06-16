import mongoose from "mongoose";
import {IISCOGroup, INewISCOGroupSpec} from "./ISCOGroupModel";
import {randomUUID} from "crypto";

export interface IISCOGroupRepository {
  readonly Model: mongoose.Model<IISCOGroup>;

  /**
   * Resolves to the newly created ISCOGroup entry, or it rejects with an error if the ISCOGroup entry could not be created.
   * @param newISCOGroupSpec
   */
  create(newISCOGroupSpec: INewISCOGroupSpec): Promise<IISCOGroup>;

  /**
   * Resolves to an array with the newly created ISCOGroup entries. If some of the documents could not be validated, they will be excluded and not saved and the function will resolve.
   * The promise will reject with an error if the ISCOGroup entries could not be created due to reasons other than not passing the validation.
   * @param newISCOGroupSpecs
   */
  batchCreate(newISCOGroupSpecs: INewISCOGroupSpec[]): Promise<IISCOGroup[]>
}

export class ISCOGroupRepository implements IISCOGroupRepository {

  public readonly Model: mongoose.Model<IISCOGroup>;

  constructor(model: mongoose.Model<IISCOGroup>) {
    this.Model = model;
  }

  async create(newISCOGroupSpec: INewISCOGroupSpec): Promise<IISCOGroup> {
    //@ts-ignore
    if (newISCOGroupSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    try {
      const newISCOGroupModel = new this.Model({
        ...newISCOGroupSpec,
        parentGroup: null,
        UUID: randomUUID()
      });
      await newISCOGroupModel.save();
      await newISCOGroupModel.populate({path: "parentGroup"});
      await newISCOGroupModel.populate({path: "childrenGroups"});
      return newISCOGroupModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async batchCreate(newISCOGroupSpecs: INewISCOGroupSpec[]): Promise<IISCOGroup[]> {
    try {
      const newISCOGroupModels = newISCOGroupSpecs.map((spec) => {
        return new this.Model({
          ...spec,
          parentGroup: null,
          UUID: randomUUID() // override UUID silently
        });
      });
      const newISCOGroups = await this.Model.insertMany(newISCOGroupModels, {
        ordered: false,
        populate: ["parentGroup", "childrenGroups"]
      });
      return newISCOGroups.map((iscoGroup) => iscoGroup.toObject());
    } catch (e: unknown) {
      console.error("batch create failed", e);
      throw e;
    }
  }
}