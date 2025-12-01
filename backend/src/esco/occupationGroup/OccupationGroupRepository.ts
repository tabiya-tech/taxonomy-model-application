import { IOccupationGroup, IOccupationGroupHistoryReference } from "esco/occupationGroup/OccupationGroup.types";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import {
  IOccupationGroupDoc,
  INewOccupationGroupSpec,
  INewOccupationGroupSpecWithoutImportId,
} from "./OccupationGroup.types";
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
   * @param {Record<string, unknown>} filter - The filter for pagination.
   * @param {number} limit - The maximum number of OccupationGroups to return.
   * @param {boolean} [desc] - Whether to sort the results in descending order. Default is true.
   * @return {Promise<{items: IOccupationGroup[], nextCursor: {_id: string, createdAt: Date} | null}>} - An array of IOccupationGroups and the next cursor (if any)
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    filter: Record<string, unknown>,
    sort: { _id: 1 | -1 },
    limit: number
  ): Promise<IOccupationGroup[]>;

  /**
   * Encode an object {_id: string, createdAt: Date} into a base64 string
   * @param {string} id - The Document id to encode
   * @param {Date} createdAt - The Document createdAt date to encode
   * @return {string} - The base64 encoded string
   */
  encodeCursor(id: string, createdAt: Date): string;

  /**
   * Decode a base64 string into an object {_id: string, createdAt: Date}
   * @param {string} cursor - The base64 encoded cursor string
   * @return {{_id: string, createdAt: Date}} - The decoded cursor object
   */
  decodeCursor(cursor: string): { id: string; createdAt: Date };

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

  constructor(model: mongoose.Model<IOccupationGroupDoc>) {
    this.Model = model;
  }

  private getCreatedAtFromObjectId(objectId: mongoose.Types.ObjectId): Date {
    return objectId.getTimestamp();
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
    filter: Record<string, unknown>,
    sort: { _id: 1 | -1 },
    limit: number
  ): Promise<IOccupationGroup[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);

      // Build aggregation pipeline
      const matchStage: Record<string, unknown> = { modelId: modelIdObj, ...filter };

      // if (cursor) {
      //   try {
      //     const cursorId = new mongoose.Types.ObjectId(cursor);
      //     if (desc) {
      //       matchStage._id = { $lt: cursorId };
      //     } else {
      //       matchStage._id = { $gt: cursorId };
      //     }
      //   } catch (error) {
      //     // If cursor is not a valid ObjectId, ignore it
      //     console.warn(`Invalid cursor provided: ${cursor}`);
      //   }
      // }

      // NOTE: We are sending 2 database queries, this is not efficient. This is because mongoose is throwing
      //       an error when trying to query by _id, using $gt or $lt: ISSUE: https://github.com/Automattic/mongoose/issues/2277#event-171765301
      //       We are creating to optimize this luxurious improvement.
      //       https://tabiya-tech.atlassian.net/browse/TAX-31

      // Get items + 1 to check if there's a next page
      const results = await this.Model.aggregate([{ $match: matchStage }, { $sort: sort }, { $limit: limit }]).exec();

      // // Separate items and check for next page
      // const hasMore = results.length > limit;
      // const pageDocs = hasMore ? results.slice(0, limit) : results;
      // // Important: the nextCursor should point to the LAST item of the current page,
      // // not the extra fetched one. Using the extra item would skip one element on the next page.
      // const nextCursorDoc = hasMore ? pageDocs[pageDocs.length - 1] : null;

      // populate parent and children for the page items using existing populate options
      const idsInOrder = results.map((d: { _id: mongoose.Types.ObjectId }) => d._id.toString());
      const objectIds = idsInOrder.map((id: string) => new mongoose.Types.ObjectId(id));
      // NOTE: query the page docs and let MongoDB return them already ordered by _id
      const populated = await this.Model.find({ _id: objectIds })
        .sort(sort)
        .populate(populateOccupationGroupParentOptions)
        .populate(populateOccupationGroupChildrenOptions)
        .exec();

      // Convert to plain objects
      const orderedObjects: IOccupationGroup[] = populated.map((doc) => doc.toObject());
      return orderedObjects;

      // return {
      //   items: orderedObjects,
      //   nextCursor: nextCursorDoc
      //     ? {
      //         _id: nextCursorDoc._id.toString(),
      //         createdAt: this.getCreatedAtFromObjectId(nextCursorDoc._id),
      //       }
      //     : null,
      // };
    } catch (e: unknown) {
      const err = new Error("OccupationGroupRepository.findPaginated: findPaginated failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  encodeCursor(id: string, createdAt: Date): string {
    const payload = {
      id: id,
      createdAt: createdAt.toISOString(),
    };
    const json = JSON.stringify(payload);
    return Buffer.from(json).toString("base64");
  }

  decodeCursor(cursor: string): { id: string; createdAt: Date } {
    const json = Buffer.from(cursor, "base64").toString("utf-8");
    const payload = JSON.parse(json);
    return {
      id: payload.id,
      createdAt: new Date(payload.createdAt),
    };
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
