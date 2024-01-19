import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IISCOGroup, IISCOGroupDoc, INewISCOGroupSpec } from "./ISCOGroup.types";
import { populateISCOGroupChildrenOptions, populateISCOGroupParentOptions } from "./populateOccupationHierarchyOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";
import { populateEmptyOccupationHierarchy } from "esco/occupationHierarchy/populateFunctions";

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

  private newSpecToModel(newSpec: INewISCOGroupSpec): mongoose.HydratedDocument<IISCOGroupDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newISCOGroupSpec: INewISCOGroupSpec): Promise<IISCOGroup> {
    //@ts-ignore
    if (newISCOGroupSpec.UUID !== undefined) {
      const err = new Error("ISCOGroupRepository.create: create failed. UUID should not be provided.");
      console.error(err);
      throw err;
    }

    try {
      const newISCOGroupModel = this.newSpecToModel(newISCOGroupSpec);
      await newISCOGroupModel.save();
      populateEmptyOccupationHierarchy(newISCOGroupModel);
      return newISCOGroupModel.toObject();
    } catch (e: unknown) {
      const err = new Error("ISCOGroupRepository.create: create failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async createMany(newISCOGroupSpecs: INewISCOGroupSpec[]): Promise<IISCOGroup[]> {
    const newISCOGroupsDocs: mongoose.Document<unknown, unknown, IISCOGroupDoc>[] = [];
    try {
      const newISCOGroupModels = newISCOGroupSpecs
        .map((spec) => {
          try {
            return this.newSpecToModel(spec);
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const docs = await this.Model.insertMany(newISCOGroupModels, {
        ordered: false,
      });
      newISCOGroupsDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<IISCOGroupDoc>(e, "ISCOGroupRepository.createMany", newISCOGroupSpecs.length);
      newISCOGroupsDocs.push(...docs);
    }

    if (newISCOGroupSpecs.length !== newISCOGroupsDocs.length) {
      console.warn(
        `ISCOGroupRepository.createMany: ${
          newISCOGroupSpecs.length - newISCOGroupsDocs.length
        } invalid entries were not created`
      );
    }
    return newISCOGroupsDocs.map((doc) => {
      populateEmptyOccupationHierarchy(doc);
      return doc.toObject();
    });
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
      const err = new Error("ISCOGroupRepository.findById: findById failed.", { cause: e });
      console.error(err);
      throw err;
    }
  }

  findAll(modelId: string): Readable {
    try {
      const pipeline = stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({ modelId: { $eq: modelId } }).cursor(),
        // in the current version we do not populate the parent, children
        new DocumentToObjectTransformer<IISCOGroup>(),
        () => undefined
      );

      pipeline.on("error", (e) => {
        const err = new Error("ISCOGroupRepository.findAll: stream failed", { cause: e });
        console.error(err);
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("ISCOGroupRepository.findAll: findAll failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
