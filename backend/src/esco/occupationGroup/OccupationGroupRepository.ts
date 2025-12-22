import { IOccupationGroup, IOccupationGroupHistoryReference } from "esco/occupationGroup/OccupationGroup.types";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import {
  IOccupationGroupDoc,
  INewOccupationGroupSpec,
  INewOccupationGroupSpecWithoutImportId,
  IOccupationGroupChild,
} from "./OccupationGroup.types";
import { IOccupationHierarchyPairDoc } from "esco/occupationHierarchy/occupationHierarchy.types";
import {
  populateOccupationGroupChildrenOptions,
  populateOccupationGroupParentOptions,
} from "./populateOccupationHierarchyOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";
import { populateEmptyOccupationHierarchy } from "esco/occupationHierarchy/populateFunctions";
import { ObjectTypes } from "esco/common/objectTypes";

export interface IOccupationGroupRepository {
  readonly Model: mongoose.Model<IOccupationGroupDoc>;
  readonly hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>;

  /**
   * Creates a new OccupationGroup entry.
   *
   * @param {INewOccupationGroupSpec} newOccupationGroupSpec - The specification for the new OccupationGroup entry.
   * @return {Promise<IOccupationGroup>} - A Promise that resolves to the newly created OccupationGroup entry.
   * Rejects with an error if the OccupationGroup entry cannot be created.
   */
  create(newOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId): Promise<IOccupationGroup>;

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
   * Finds a OccupationGroup parent entry by its child occupation group ID.
   *
   * @param {string} id - The unique ID of the child OccupationGroup entry to find its parent.
   * @return {Promise<IOccupationGroup|null>} - A Promise that resolves to the found parent OccupationGroup entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findParent(id: string | mongoose.Types.ObjectId): Promise<IOccupationGroup | null>;

  /**
   * Finds a OccupationGroup children entry by its parent occupation group ID.
   *
   * @param {string} id - The unique ID of the parent OccupationGroup entry to find its children.
   * @return {Promise<IOccupationGroupChild[]>} - A Promise that resolves to the found children OccupationGroup entries or an empty array if not found.
   * Rejects with an error if the operation fails.
   */
  findChildren(id: string | mongoose.Types.ObjectId): Promise<IOccupationGroupChild[]>;

  /**
   * Returns all OccupationGroups as a stream. The OccupationGroups are transformed to objects (via the .toObject()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the OccupationGroups.
   * @return {Readable} - A Readable stream of IOccupationGroups
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;

  /**
   * Returns paginated OccupationGroups. The OccupationGroups are transformed to objects (via .lean()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the OccupationGroups.
   * @param {number} limit - The maximum number of OccupationGroups to return.
   * @param {1 | -1} sortOrder - The sort order to apply to the query.
   * @param {string} [cursorId] - Optional cursor ID for pagination.
   * @param {Record<string, unknown>} [filter] - Optional filter to apply to the query.
   * @return {Promise<IOccupationGroup[]>} - A Promise that resolves to an array of OccupationGroups.
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>
  ): Promise<IOccupationGroup[]>;

  /**
   * Finds an OccupationGroup entry by it's UUID.
   *
   * @param {string} uuid - The unique UUID of the OccupationGroup entry to find.
   * @return {Promise<IOccupationGroup|null>} - A Promise that resolves to the found OccupationGroup entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  getOccupationGroupByUUID(uuid: string): Promise<IOccupationGroup | null>;

  /**
   * Get UUIDHistory for occupation group.
   *
   * @return {Promise<IOccupationGroupHistoryReference[]|null>} - A promise that resolves to an array with the UUIDHistory for the occupationGroup. if the occupationGroup does not exist it returns an empty array
   * @param uuids - The UUIDs to resolve, if the uuid does not exist we return an object with that uuid, and null for the rest of the fields
   */
  getHistory(uuids: string[]): Promise<IOccupationGroupHistoryReference[]>;
}

export class OccupationGroupRepository implements IOccupationGroupRepository {
  public readonly Model: mongoose.Model<IOccupationGroupDoc>;
  public readonly hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>;

  constructor(model: mongoose.Model<IOccupationGroupDoc>, hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>) {
    this.Model = model;
    this.hierarchyModel = hierarchyModel;
  }

  private newSpecToModel(newSpec: INewOccupationGroupSpec): mongoose.HydratedDocument<IOccupationGroupDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
      importId: newSpec.importId,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  private newSpecWithoutImportIdToModel(
    newSpec: INewOccupationGroupSpecWithoutImportId
  ): mongoose.HydratedDocument<IOccupationGroupDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
      importId: null,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newOccupationGroupSpec: INewOccupationGroupSpecWithoutImportId): Promise<IOccupationGroup> {
    //@ts-ignore
    if (newOccupationGroupSpec.UUID !== undefined) {
      const err = new Error("OccupationGroupRepository.create: create failed. UUID should not be provided.");
      console.error(err);
      throw err;
    }

    try {
      const newOccupationGroupModel = this.newSpecWithoutImportIdToModel(newOccupationGroupSpec);
      await newOccupationGroupModel.save();
      populateEmptyOccupationHierarchy(newOccupationGroupModel);
      return newOccupationGroupModel.toObject();
    } catch (e: unknown) {
      const err = new Error("OccupationGroupRepository.create: create failed" + e, { cause: e });
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

  async findParent(id: string | mongoose.Types.ObjectId): Promise<IOccupationGroup | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const relation = await this.hierarchyModel.findOne({ childId: id }).lean();
      if (!relation) return null;
      return this.findById(relation.parentId);
    } catch (e: unknown) {
      const err = new Error("OccupationGroupRepository.findParent: findParent failed.", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findChildren(id: string | mongoose.Types.ObjectId): Promise<IOccupationGroupChild[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return [];

      const result = await this.hierarchyModel.aggregate([
        {
          $match: { parentId: new mongoose.Types.ObjectId(id) },
        },
        {
          $lookup: {
            from: "occupationgroupmodels",
            localField: "childId",
            foreignField: "_id",
            as: "occupationGroup",
          },
        },
        {
          $lookup: {
            from: "occupationmodels",
            localField: "childId",
            foreignField: "_id",
            as: "occupation",
          },
        },
        {
          $addFields: {
            child: {
              $cond: [
                {
                  $in: ["$childType", [ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup]],
                },
                { $arrayElemAt: ["$occupationGroup", 0] },
                { $arrayElemAt: ["$occupation", 0] },
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
            originUUID: "$child.originUUID",
            UUIDHistory: "$child.UUIDHistory",

            originUri: "$child.originUri",
            code: "$child.code",
            description: "$child.description",
            preferredLabel: "$child.preferredLabel",
            altLabels: "$child.altLabels",

            objectType: "$childType",
            modelId: { $toString: "$modelId" },

            createdAt: "$child.createdAt",
            updatedAt: "$child.updatedAt",
          },
        },
      ]);
      return result as IOccupationGroupChild[];
    } catch (e: unknown) {
      const err = new Error("OccupationGroupRepository.findChildren: findChildren failed.", {
        cause: e,
      });
      console.error(err);
      throw err;
    }
  }

  async getOccupationGroupByUUID(occupationUUID: string): Promise<IOccupationGroup | null> {
    try {
      const filter = {
        UUID: { $eq: occupationUUID },
      };
      const occupationGroupInfo = await this.Model.findOne(filter)
        .populate([populateOccupationGroupParentOptions, populateOccupationGroupChildrenOptions])
        .exec();
      if (occupationGroupInfo == null) {
        return null;
      }
      return occupationGroupInfo.toObject();
    } catch (e: unknown) {
      const err = new Error("OccupationGroupRepository.getOccupationGroupByUUID: getOccupationGroupByUUID failed", {
        cause: e,
      });
      console.error(err);
      throw err;
    }
  }

  //TODO: select * from relations where parent_id = $id limit $limit offset $offset

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

  async findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>
  ): Promise<IOccupationGroup[]> {
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
        populateOccupationGroupParentOptions,
        populateOccupationGroupChildrenOptions,
      ]);

      return populated.map((doc) => doc.toObject());
    } catch (e: unknown) {
      const err = new Error("OccupationGroupRepository.findPaginated: findPaginated failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async getHistory(uuids: string[]): Promise<IOccupationGroupHistoryReference[]> {
    try {
      // Turns out mongoose adds the $in operator automatically, and fails for string fields if we try to use $in
      const occupationGroupsFromDb = await this.Model.find(
        { UUID: uuids },
        { UUID: 1, _id: 1, code: 1, preferredLabel: 1, groupType: 1 }
      ).exec();

      // Create a map of UUIDs to OccupationGroup for easy lookup
      const occupationGroupsMap = new Map(occupationGroupsFromDb.map((group) => [group.UUID, group]));

      return uuids.map((uuid) => {
        const group = occupationGroupsMap.get(uuid);
        if (group) {
          return {
            id: group._id.toString(),
            UUID: group.UUID,
            code: group.code,
            preferredLabel: group.preferredLabel,
            objectType: group.groupType,
          };
        } else {
          // Return null values for UUIDs not found in the database
          return {
            id: null,
            UUID: uuid,
            code: null,
            preferredLabel: null,
            objectType: null,
          };
        }
      });
    } catch (e) {
      // Handle any errors
      const err = new Error("OccupationGroupRepository.getUUIDHistory: getUUIDHistory failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
