import mongoose from "mongoose";
import { randomUUID } from "crypto";
import {
  INewSkillGroupSpec,
  INewSkillGroupSpecWithoutImportId,
  ISkillGroup,
  ISkillGroupChild,
  ISkillGroupDoc,
} from "./skillGroup.types";
import { populateSkillGroupChildrenOptions, populateSkillGroupParentsOptions } from "./populateSkillHierarchyOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";
import { populateEmptySkillHierarchy } from "esco/skillHierarchy/populateFunctions";
import { ISkillHierarchyPairDoc } from "esco/skillHierarchy/skillHierarchy.types";
import { ObjectTypes } from "esco/common/objectTypes";

export interface ISkillGroupRepository {
  readonly Model: mongoose.Model<ISkillGroupDoc>;
  readonly hierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>;
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
   * Returns paginated SkillGroups. The SkillGroups are transformed to objects (via .lean()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the SkillGroups.
   * @param {number} limit - The maximum number of SkillGroups to return.
   * @param {1 | -1} sortOrder - The sort order to apply to the query.
   * @param {string} [cursorId] - Optional cursor ID for pagination.
   * @param {Record<string, unknown>} [filter] - Optional filter to apply to the query.
   * @return {Promise<ISkillGroup[]>} - A Promise that resolves to an array of SkillGroups.
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>
  ): Promise<ISkillGroup[]>;

  /**
   * Finds a SkillGroup parents entry by its child SkillGroup ID.
   *
   * @param {string} id - The unique ID of the child SkillGroup entry to find the parents for.
   * @return {Promise<ISkillGroup[]>} - A Promise that resolves to an array of parent SkillGroup entries of the child SkillGroup. If the child SkillGroup has no parents, resolves to an empty array.
   * Rejects with an error if the operation fails.
   */
  findParents(id: string | mongoose.Types.ObjectId): Promise<ISkillGroup[]>;

  /**
   * Finds a SkillGroup children entry by its parent SkillGroup ID.
   *
   * @param {string} id - The unique ID of the parent SkillGroup entry to find the children for.
   * @return {Promise<ISkillGroupChild[]>} - A Promise that resolves to an array of child SkillGroup entries of the parent SkillGroup. If the parent SkillGroup has no children, resolves to an empty array.
   * Rejects with an error if the operation fails.
   */
  findChildren(id: string | mongoose.Types.ObjectId): Promise<ISkillGroupChild[]>;
}

export class SkillGroupRepository implements ISkillGroupRepository {
  public readonly Model: mongoose.Model<ISkillGroupDoc>;
  public readonly hierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>;

  constructor(model: mongoose.Model<ISkillGroupDoc>, hierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>) {
    this.Model = model;
    this.hierarchyModel = hierarchyModel;
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
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>
  ): Promise<ISkillGroup[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      // Build the match stage
      const matchStage: Record<string, unknown> = { ...filter, modelId: modelIdObj };

      // If a cursorId is provided, add it to the match stage to get results after the cursor
      if (cursorId && mongoose.Types.ObjectId.isValid(cursorId)) {
        const operator = sortOrder === -1 ? "$lt" : "$gt";
        matchStage._id = { [operator]: new mongoose.Types.ObjectId(cursorId) };
      }

      // Execute the aggregation pipeline
      // We use aggregation to handle filtering, sorting and limiting in a single query
      const results = await this.Model.aggregate([
        { $match: matchStage },
        { $sort: { _id: sortOrder } },
        { $limit: limit },
      ]).exec();

      // Hydrate the aggregation results to Mongoose documents
      // This is necessary because aggregate() returns plain objects, but populate() requires Mongoose documents
      const hydrated = results.map((r) => this.Model.hydrate(r));
      const populated = await this.Model.populate(hydrated, [
        populateSkillGroupParentsOptions,
        populateSkillGroupChildrenOptions,
      ]);

      return populated.map((doc) => doc.toObject());
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

  async findParents(id: string | mongoose.Types.ObjectId): Promise<ISkillGroup[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return [] as ISkillGroup[];
      const relations = await this.hierarchyModel.find({ childId: { $eq: new mongoose.Types.ObjectId(id) } }).exec();
      if (!relations.length) return [] as ISkillGroup[];
      const parentIds = relations.map((relation) => relation.parentId);
      const parents = await this.Model.find({ _id: mongoose.trusted({ $in: parentIds }) })
        .populate(populateSkillGroupParentsOptions)
        .populate(populateSkillGroupChildrenOptions)
        .exec();
      return parents.map((parent) => parent.toObject());
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findParents: findParents failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
  async findChildren(id: string | mongoose.Types.ObjectId): Promise<ISkillGroupChild[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return [] as ISkillGroupChild[];
      const result = await this.hierarchyModel.aggregate([
        {
          $match: { parentId: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "skillgroupmodels",
            localField: "childId",
            foreignField: "_id",
            as: "skillGroup",
          },
        },
        {
          $lookup: {
            from: "skillmodels",
            localField: "childId",
            foreignField: "_id",
            as: "skill",
          },
        },
        {
          $addFields: {
            child: {
              $cond: [
                {
                  $in: ["$childType", [ObjectTypes.SkillGroup]],
                },
                {
                  $arrayElemAt: ["$skillGroup", 0],
                },
                {
                  $arrayElemAt: ["$skill", 0],
                },
              ],
            },
          },
        },
        {
          $match: {
            child: { $ne: null },
          },
        },
        {
          $project: {
            _id: 0,
            id: { $toString: "$child._id" },
            parentId: { $toString: "$parentId" },
            UUID: "$child.UUID",
            UUIDHistory: "$child.UUIDHistory",

            originUri: "$child.originUri",
            description: "$child.description",
            preferredLabel: "$child.preferredLabel",
            altLabels: "$child.altLabels",

            code: {
              $cond: {
                if: { $ne: ["$child.code", null] },
                then: "$child.code",
                else: "$$REMOVE",
              },
            },
            isLocalized: {
              $cond: {
                if: { $ne: ["$child.isLocalized", null] },
                then: "$child.isLocalized",
                else: "$$REMOVE",
              },
            },

            objectType: "$childType",
            modelId: { $toString: "$modelId" },

            createdAt: "$child.createdAt",
            updatedAt: "$child.updatedAt",
          },
        },
      ]);
      return result as ISkillGroupChild[];
    } catch (e: unknown) {
      const err = new Error("SkillGroupRepository.findChildren: findChildren failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
