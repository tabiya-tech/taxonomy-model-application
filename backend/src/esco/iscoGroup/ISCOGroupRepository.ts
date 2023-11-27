import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IISCOGroup, IISCOGroupDoc, INewISCOGroupSpec } from "./ISCOGroup.types";
import { populateISCOGroupChildrenOptions, populateISCOGroupParentOptions } from "./populateOccupationHierarchyOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { ISCOGroupModelPaths } from "./ISCOGroupModel";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";

export interface IISCOGroupRepository {
  readonly Model: mongoose.Model<IISCOGroupDoc>;

  /**
   * Creates a new ISCOGroup entry.
   *
   * @param {INewISCOGroupSpec} newISCOGroupSpec - The specification for the new ISCOGroup entry.
   * @return {Promise<IISCOGroup>} - A Promise that resolves to the newly created ISCOGroup entry.
   * Rejects with an error if the ISCOGroup entry cannot be created.
   */
  create(newISCOGroupSpec: INewISCOGroupSpec): Promise<IISCOGroup>;

  /**
   * Creates multiple new ISCOGroup entries.
   *
   * @param {INewISCOGroupSpec[]} newISCOGroupSpecs - An array of specifications for the new ISCOGroup entries.
   * @return {Promise<IISCOGroup[]>} - A Promise that resolves to an array containing the newly created ISCOGroup entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newISCOGroupSpecs: INewISCOGroupSpec[]): Promise<IISCOGroup[]>;

  /**
   * Finds a ISCOGroup entry by its ID.
   *
   * @param {string} id - The unique ID of the ISCOGroup entry to find.
   * @return {Promise<IISCOGroup|null>} - A Promise that resolves to the found ISCOGroup entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string | mongoose.Types.ObjectId): Promise<IISCOGroup | null>;

  /**
   * Returns all ISCOGroups as a stream. The ISCOGroups are transformed to objects (via the .toObject()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the ISCOGroups.
   * @return {Readable} - A Readable stream of IISCOGroups
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;
}

export class ISCOGroupRepository implements IISCOGroupRepository {
  public readonly Model: mongoose.Model<IISCOGroupDoc>;

  constructor(model: mongoose.Model<IISCOGroupDoc>) {
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
        UUID: randomUUID(),
      });
      await newISCOGroupModel.save();
      await newISCOGroupModel.populate([{ path: ISCOGroupModelPaths.parent }, { path: ISCOGroupModelPaths.children }]);
      return newISCOGroupModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(newISCOGroupSpecs: INewISCOGroupSpec[]): Promise<IISCOGroup[]> {
    try {
      const newISCOGroupModels = newISCOGroupSpecs
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
      const newISCOGroups = await this.Model.insertMany(newISCOGroupModels, {
        ordered: false,
        populate: [ISCOGroupModelPaths.parent, ISCOGroupModelPaths.children],
      });
      if (newISCOGroupSpecs.length !== newISCOGroups.length) {
        console.warn(
          `ISCOGroupRepository.createMany: ${
            newISCOGroupSpecs.length - newISCOGroups.length
          } invalid entries were not created`
        );
      }
      return newISCOGroups.map((iscoGroup) => iscoGroup.toObject());
    } catch (e: unknown) {
      const populationOptions = [{ path: ISCOGroupModelPaths.parent }, { path: ISCOGroupModelPaths.children }];
      return handleInsertManyError<IISCOGroup>(
        e,
        "ISCOGroupRepository.createMany",
        newISCOGroupSpecs.length,
        populationOptions
      );
    }
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<IISCOGroup | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const iscoGroup = await this.Model.findById(id)
        .populate(populateISCOGroupParentOptions)
        .populate(populateISCOGroupChildrenOptions)
        .exec();
      return iscoGroup ? iscoGroup.toObject() : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      throw e;
    }
  }

  findAll(modelId: string): Readable {
    try {
      return stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({ modelId: { $eq: modelId } }).cursor(),
        // in the current version we do not populate the parent, children
        new DocumentToObjectTransformer<IISCOGroup>(),
        () => undefined
      );
    } catch (e: unknown) {
      console.error("findAll failed", e);
      throw e;
    }
  }
}
