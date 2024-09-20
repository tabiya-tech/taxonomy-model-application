import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { IOccupationGroup, IOccupationGroupDoc, INewOccupationGroupSpec } from "./OccupationGroup.types";
import {
  populateOccupationGroupChildrenOptions,
  populateOccupationGroupParentOptions,
} from "./populateOccupationHierarchyOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";
import { populateEmptyOccupationHierarchy } from "esco/occupationHierarchy/populateFunctions";

export interface IOccupationGroupRepository {
  readonly Model: mongoose.Model<IOccupationGroupDoc>;

  /**
   * Creates a new OccupationGroup entry.
   *
   * @param {INewOccupationGroupSpec} newOccupationGroupSpec - The specification for the new OccupationGroup entry.
   * @return {Promise<IOccupationGroup>} - A Promise that resolves to the newly created OccupationGroup entry.
   * Rejects with an error if the OccupationGroup entry cannot be created.
   */
  create(newOccupationGroupSpec: INewOccupationGroupSpec): Promise<IOccupationGroup>;

  /**
   * Creates multiple new OccupationGroup entries.
   *
   * @param {INewOccupationGroupSpec[]} newOccupationGroupSpecs - An array of specifications for the new OccupationGroup entries.
   * @return {Promise<IOccupationGroup[]>} - A Promise that resolves to an array containing the newly created OccupationGroup entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newOccupationGroupSpecs: INewOccupationGroupSpec[]): Promise<IOccupationGroup[]>;

  /**
   * Finds a OccupationGroup entry by its ID.
   *
   * @param {string} id - The unique ID of the OccupationGroup entry to find.
   * @return {Promise<IOccupationGroup|null>} - A Promise that resolves to the found OccupationGroup entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string | mongoose.Types.ObjectId): Promise<IOccupationGroup | null>;

  /**
   * Returns all OccupationGroups as a stream. The OccupationGroups are transformed to objects (via the .toObject()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the OccupationGroups.
   * @return {Readable} - A Readable stream of IOccupationGroups
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;
}

export class OccupationGroupRepository implements IOccupationGroupRepository {
  public readonly Model: mongoose.Model<IOccupationGroupDoc>;

  constructor(model: mongoose.Model<IOccupationGroupDoc>) {
    this.Model = model;
  }

  private newSpecToModel(newSpec: INewOccupationGroupSpec): mongoose.HydratedDocument<IOccupationGroupDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newOccupationGroupSpec: INewOccupationGroupSpec): Promise<IOccupationGroup> {
    //@ts-ignore
    if (newOccupationGroupSpec.UUID !== undefined) {
      const err = new Error("OccupationGroupRepository.create: create failed. UUID should not be provided.");
      console.error(err);
      throw err;
    }

    try {
      const newOccupationGroupModel = this.newSpecToModel(newOccupationGroupSpec);
      await newOccupationGroupModel.save();
      populateEmptyOccupationHierarchy(newOccupationGroupModel);
      return newOccupationGroupModel.toObject();
    } catch (e: unknown) {
      const err = new Error("OccupationGroupRepository.create: create failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async createMany(newOccupationGroupSpecs: INewOccupationGroupSpec[]): Promise<IOccupationGroup[]> {
    const newOccupationGroupsDocs: mongoose.Document<unknown, unknown, IOccupationGroupDoc>[] = [];
    try {
      const newOccupationGroupModels = newOccupationGroupSpecs
        .map((spec) => {
          try {
            return this.newSpecToModel(spec);
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const docs = await this.Model.insertMany(newOccupationGroupModels, {
        ordered: false,
      });
      newOccupationGroupsDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<IOccupationGroupDoc>(
        e,
        "OccupationGroupRepository.createMany",
        newOccupationGroupSpecs.length
      );
      newOccupationGroupsDocs.push(...docs);
    }

    if (newOccupationGroupSpecs.length !== newOccupationGroupsDocs.length) {
      console.warn(
        `OccupationGroupRepository.createMany: ${
          newOccupationGroupSpecs.length - newOccupationGroupsDocs.length
        } invalid entries were not created`
      );
    }
    return newOccupationGroupsDocs.map((doc) => {
      populateEmptyOccupationHierarchy(doc);
      return doc.toObject();
    });
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<IOccupationGroup | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const occupationGroup = await this.Model.findById(id)
        .populate(populateOccupationGroupParentOptions)
        .populate(populateOccupationGroupChildrenOptions)
        .exec();
      return occupationGroup ? occupationGroup.toObject() : null;
    } catch (e: unknown) {
      const err = new Error("OccupationGroupRepository.findById: findById failed.", { cause: e });
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
        new DocumentToObjectTransformer<IOccupationGroup>(),
        () => undefined
      );

      pipeline.on("error", (e) => {
        const err = new Error("OccupationGroupRepository.findAll: stream failed", { cause: e });
        console.error(err);
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("OccupationGroupRepository.findAll: findAll failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
