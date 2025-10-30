import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewSkillGroupSpec, INewSkillGroupSpecWithoutImportId, ISkillGroup, ISkillGroupDoc } from "./skillGroup.types";
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
   * @param {INewSkillGroupSpecWithoutImportId} INewSkillGroupSpecWithoutImportId - The specification for the new SkillGroup entry.
   * @return {Promise<ISkillGroup>} - A Promise that resolves to the newly created ISkillGroup entry.
   * Rejects with an error if the SkillGroup entry cannot be created.
   */

  create(newSkillGroupSpec: INewSkillGroupSpecWithoutImportId): Promise<ISkillGroup>;

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

  /**
   * Returns paginated SkillGroups. The SkillGroups are transformed to objects (via the .lean()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the SkillGroups.
   * @param {Record<string, unknown>} filter - The filter to apply.
   * @param {number} limit - The maximum number of SkillGroups to return.
   * @param {boolean} [desc] - Whether to sort the result in descending order. Default is true.
   * @return {Promise<{items: ISkillGroup[]}>} - An array paginated of ISkillGroups.
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    filter: Record<string, unknown>,
    sort: { _id: 1 | -1 },
    limit: number
  ): Promise<ISkillGroup[]>;
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

  private newSpecWithoutImportIdToModel(
    newSpe: INewSkillGroupSpecWithoutImportId
  ): mongoose.HydratedDocument<ISkillGroupDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpe,
      UUID: newUUID,
      importId: null,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newSkillGroupSpec: INewSkillGroupSpecWithoutImportId): Promise<ISkillGroup> {
    //@ts-ignore
    if (newSkillGroupSpec.UUID !== undefined) {
      const err = new Error("SkillGroupRepository.create: create failed. UUID should not be provided");
      console.error(err);
      throw err;
    }

    try {
      const newSkillGroupModel = this.newSpecWithoutImportIdToModel(newSkillGroupSpec);
      await newSkillGroupModel.save();
      populateEmptySkillHierarchy(newSkillGroupModel);
      return newSkillGroupModel.toObject();
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.create: create failed", { cause: e });
      console.error(err);
      throw err;
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
      const err = new Error("SkillGroupRepository.findById: findById failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findPaginated(
    modelId: string,
    filter: Record<string, unknown>,
    sort: { _id: 1 | -1 },
    limit: number
  ): Promise<ISkillGroup[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      // Build aggregation pipeline
      const matchStage: Record<string, unknown> = { modelId: modelIdObj, ...filter };
      // NOTE: We are sending 2 database queries, this is not efficient. This is because mongoose is throwing
      //       an error when trying to query by _id, using $gt or $lt: ISSUE: https://github.com/Automattic/mongoose/issues/2277#event-171765301
      //       We are creating to optimize this luxurious improvement.
      //       https://tabiya-tech.atlassian.net/browse/TAX-31
      //TODO: Optimize this luxurious improvement.

      // Get items + 1 to check if there's a next page
      const results = await this.Model.aggregate([{ $match: matchStage }, { $sort: sort }, { $limit: limit }]).exec();

      // populate parents and children for the page items using existing populate options
      const idsInOrder = results.map((d: { _id: mongoose.Types.ObjectId }) => d._id.toString());
      const objectIds = idsInOrder.map((id: string) => new mongoose.Types.ObjectId(id));
      // Note: query the page docs let MongoDB return them already ordered by _id
      const populated = await this.Model.find({ _id: objectIds })
        .sort(sort)
        .populate(populateSkillGroupParentsOptions)
        .populate(populateSkillGroupChildrenOptions)
        .exec();

      // Convert to plain objects
      const orderedObjects: ISkillGroup[] = populated.map((doc) => doc.toObject());
      return orderedObjects;
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findPaginated: findPaginated failed", { cause: e });
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
        new DocumentToObjectTransformer<ISkillGroup>(),
        () => undefined
      );
      pipeline.on("error", (e) => {
        console.error(new Error("SkillGroupRepository.findAll: stream failed", { cause: e }));
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findAll: findAll failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
