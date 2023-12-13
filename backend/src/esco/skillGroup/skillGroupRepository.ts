import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewSkillGroupSpec, ISkillGroup, ISkillGroupDoc } from "./skillGroup.types";
import { populateSkillGroupChildrenOptions, populateSkillGroupParentsOptions } from "./populateSkillHierarchyOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";
import { populateEmptySkillHierarchy } from "esco/skillHierarchy/populateFunctions";

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

  /**
   * Returns all SkillGroups as a stream. The SkillGroups are transformed to objects (via the .toObject()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the SkillGroups.
   * @return {Readable} - A Readable stream of ISkillGroups
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;
}

export class SkillGroupRepository implements ISkillGroupRepository {
  public readonly Model: mongoose.Model<ISkillGroupDoc>;

  constructor(model: mongoose.Model<ISkillGroupDoc>) {
    this.Model = model;
  }

  private newSpecToModel(newSpec: INewSkillGroupSpec): mongoose.HydratedDocument<ISkillGroupDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newSkillGroupSpec: INewSkillGroupSpec): Promise<ISkillGroup> {
    //@ts-ignore
    if (newSkillGroupSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error(new Error("create failed", { cause: e }));
      throw e;
    }

    try {
      const newSkillGroupModel = this.newSpecToModel(newSkillGroupSpec);
      await newSkillGroupModel.save();
      populateEmptySkillHierarchy(newSkillGroupModel);
      return newSkillGroupModel.toObject();
    } catch (e: unknown) {
      console.error(new Error("create failed", { cause: e }));
      throw e;
    }
  }

  async createMany(newSkillGroupSpecs: INewSkillGroupSpec[]): Promise<ISkillGroup[]> {
    const newSkillGroupsDocuments: mongoose.Document<unknown, unknown, ISkillGroupDoc>[] = [];
    try {
      const newSkillGroupModels = newSkillGroupSpecs
        .map((spec) => {
          try {
            return this.newSpecToModel(spec);
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const docs = await this.Model.insertMany(newSkillGroupModels, {
        ordered: false,
      });
      newSkillGroupsDocuments.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<ISkillGroupDoc>(
        e,
        "SkillGroupRepository.createMany",
        newSkillGroupSpecs.length
      );
      newSkillGroupsDocuments.push(...docs);
    }
    if (newSkillGroupSpecs.length !== newSkillGroupsDocuments.length) {
      console.warn(
        `SkillGroupRepository.createMany: ${
          newSkillGroupSpecs.length - newSkillGroupsDocuments.length
        } invalid entries were not created`
      );
    }
    return newSkillGroupsDocuments.map((skillGroup) => {
      populateEmptySkillHierarchy(skillGroup);
      return skillGroup.toObject();
    });
  }

  async findById(id: string): Promise<ISkillGroup | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const skillGroup = await this.Model.findById(id)
        .populate(populateSkillGroupParentsOptions)
        .populate(populateSkillGroupChildrenOptions)
        .exec();
      return skillGroup != null ? skillGroup.toObject() : null;
    } catch (e: unknown) {
      console.error(new Error("findById failed", { cause: e }));
      throw e;
    }
  }

  findAll(modelId: string): Readable {
    try {
      return stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({ modelId: { $eq: modelId } }).cursor(),
        // in the current version we do not populate the parent, children
        new DocumentToObjectTransformer<ISkillGroup>(),
        () => undefined
      );
    } catch (e: unknown) {
      console.error(new Error("findAll failed", { cause: e }));
      throw e;
    }
  }
}
