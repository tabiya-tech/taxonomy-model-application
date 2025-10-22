import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewOccupationSpec, IOccupation, IOccupationDoc } from "./occupation.types";
import {
  populateOccupationChildrenOptions,
  populateOccupationParentOptions,
} from "./populateOccupationHierarchyOptions";
import { populateOccupationRequiresSkillsOptions } from "./populateOccupationToSkillRelationOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";
import { populateEmptyOccupationHierarchy } from "esco/occupationHierarchy/populateFunctions";
import { populateEmptyRequiresSkills } from "esco/occupationToSkillRelation/populateFunctions";
import { ObjectTypes } from "esco/common/objectTypes";

export type SearchFilter = {
  occupationType?: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
};

export interface IOccupationRepository {
  readonly Model: mongoose.Model<IOccupationDoc>;

  /**
   * Creates a new Occupation entry.
   *
   * @param {INewOccupationSpec} newOccupationSpec - The specification for the new Occupation entry.
   * @return {Promise<IOccupation>} - A Promise that resolves to the newly created Occupation entry.
   * Rejects with an error if the Occupation entry cannot be created ue to reasons other than validation.
   */
  create(newOccupationSpec: INewOccupationSpec): Promise<IOccupation>;

  /**
   * Creates multiple new Occupation entries.
   *
   * @param {INewOccupationSpec[]} newOccupationSpecs - An array of specifications for the new Occupation entries.
   * @return {Promise<IOccupation[]>} - A Promise that resolves to an array containing the newly created Occupation entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]>;

  /**
   * Finds an Occupation entry by its ID.
   *
   * @param {string} id - The unique ID of the Occupation entry.
   * @return {Promise<IOccupation|null>} - A Promise that resolves to the found Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<IOccupation | null>;

  /**
   * Returns all occupations as a stream. The Occupations are transformed to objects (via the .toObject()).
   * Note: This method uses streaming for performance and does not populate relationships (parent, children, required skills).
   * Use findById or findPaginated if you need populated relationships.
   * @param {string} modelId - The modelId of the occupations.
   * @param {SearchFilter} filter - Used for restricting the search.
   * @return {Readable} - A Readable stream of IOccupations
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string, filter?: SearchFilter): Readable;

  /**
   * Returns paginated Occupations with populated relationships (parent, children, required skills).
   * @param {string} modelId - The modelId of the Occupations.
   * @param {string} cursor - The cursor for pagination.
   * @param {number} limit - The maximum number of Occupations to return.
   * @param {boolean} [desc] - Whether to sort the results in descending order. Default is true.
   * @return {Promise<{items: IOccupation[], nextCursor: {_id: string, createdAt: Date} | null}>} - An array of IOccupations and the next cursor (if any)
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    cursor: string | undefined,
    limit: number,
    desc?: boolean
  ): Promise<{ items: IOccupation[]; nextCursor: { _id: string; createdAt: Date } | null }>;

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
   * Finds an Occupation entry by it's UUID.
   *
   * @param {string} uuid - The unique UUID of the Occupation entry to find.
   * @return {Promise<IOccupation|null>} - A Promise that resolves to the found Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  getOccupationByUUID(uuid: string): Promise<IOccupation | null>;
}

export class OccupationRepository implements IOccupationRepository {
  public readonly Model: mongoose.Model<IOccupationDoc>;

  constructor(model: mongoose.Model<IOccupationDoc>) {
    this.Model = model;
  }

  private getCreatedAtFromObjectId(objectId: mongoose.Types.ObjectId): Date {
    return objectId.getTimestamp();
  }

  private newSpecToModel(newSpec: INewOccupationSpec): mongoose.HydratedDocument<IOccupationDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newOccupationSpec: INewOccupationSpec): Promise<IOccupation> {
    //@ts-ignore
    if (newOccupationSpec.UUID !== undefined) {
      const err = new Error("OccupationRepository.create: create failed. UUID should not be provided.");
      console.error(err);
      throw err;
    }

    try {
      const newOccupationModel = this.newSpecToModel(newOccupationSpec);
      await newOccupationModel.save();
      populateEmptyOccupationHierarchy(newOccupationModel);
      populateEmptyRequiresSkills(newOccupationModel);
      return newOccupationModel.toObject();
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.create: create failed.", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async createMany(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]> {
    const newOccupationsDocs: mongoose.Document<unknown, unknown, IOccupationDoc>[] = [];
    try {
      const newOccupationModels = newOccupationSpecs
        .map((spec) => {
          try {
            return this.newSpecToModel(spec);
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);

      const docs = await this.Model.insertMany(newOccupationModels, {
        ordered: false,
      });
      newOccupationsDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<IOccupationDoc>(
        e,
        "OccupationRepository.createMany",
        newOccupationSpecs.length
      );
      newOccupationsDocs.push(...docs);
    }
    if (newOccupationSpecs.length !== newOccupationsDocs.length) {
      console.warn(
        `OccupationRepository.createMany: ${
          newOccupationSpecs.length - newOccupationsDocs.length
        } invalid entries were not created`
      );
    }
    return newOccupationsDocs.map((doc) => {
      populateEmptyOccupationHierarchy(doc);
      populateEmptyRequiresSkills(doc);
      return doc.toObject();
    });
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<IOccupation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const occupation = await this.Model.findById(id)
        .populate(populateOccupationParentOptions)
        .populate(populateOccupationChildrenOptions)
        .populate(populateOccupationRequiresSkillsOptions)
        .exec();

      if (!occupation) return null;
      return occupation.toObject();
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findById: findById failed.", { cause: e });
      console.error(err);
      throw err;
    }
  }

  findAll(modelId: string, filter?: SearchFilter): Readable {
    // If occupationType is set then allow only ESCO or Local occupations
    if (
      filter?.occupationType !== undefined &&
      filter.occupationType !== ObjectTypes.ESCOOccupation &&
      filter.occupationType !== ObjectTypes.LocalOccupation
    ) {
      const err = new Error(
        "OccupationRepository.findAll: findAll failed. OccupationType must be either ESCO or LOCAL."
      );
      console.error(err);
      throw err;
    }

    try {
      const pipeline = stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({
          modelId: { $eq: modelId },
          ...(filter?.occupationType !== undefined ? { occupationType: { $eq: filter.occupationType } } : {}),
        }).cursor(), // Note: findAll uses streaming for performance and does not populate relationships
        new DocumentToObjectTransformer<IOccupation>(),
        () => undefined
      );
      pipeline.on("error", (e) => {
        console.error(new Error("OccupationRepository.findAll: stream failed", { cause: e }));
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findAll: findAll failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findPaginated(
    modelId: string,
    cursor: string | undefined,
    limit: number,
    desc: boolean = true
  ): Promise<{ items: IOccupation[]; nextCursor: { _id: string; createdAt: Date } | null }> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);

      // Build aggregation pipeline
      const matchStage: Record<string, unknown> = { modelId: modelIdObj };

      if (cursor) {
        try {
          const cursorId = new mongoose.Types.ObjectId(cursor);
          if (desc) {
            matchStage._id = { $lt: cursorId };
          } else {
            matchStage._id = { $gt: cursorId };
          }
        } catch (error) {
          // If cursor is not a valid ObjectId, ignore it
          console.warn(`Invalid cursor provided: ${cursor}`);
        }
      }

      // Get items + 1 to check if there's a next page
      const results = await this.Model.aggregate([
        { $match: matchStage },
        { $sort: { _id: desc ? -1 : 1 } },
        { $limit: limit + 1 },
      ]).exec();

      // Separate items and check for next page
      const hasMore = results.length > limit;
      const pageDocs = hasMore ? results.slice(0, limit) : results;
      // Important: the nextCursor should point to the LAST item of the current page,
      // not the extra fetched one. Using the extra item would skip one element on the next page.
      const nextCursorDoc = hasMore ? pageDocs[pageDocs.length - 1] : null;

      // populate parent and children for the page items using existing populate options
      const idsInOrder = pageDocs.map((d) => d._id.toString());
      const objectIds = idsInOrder.map((id) => new mongoose.Types.ObjectId(id));
      // NOTE: query the page docs and let MongoDB return them already ordered by _id
      const populated = await this.Model.find({ _id: objectIds })
        .sort({ _id: desc ? -1 : 1 })
        .populate(populateOccupationParentOptions)
        .populate(populateOccupationChildrenOptions)
        .populate(populateOccupationRequiresSkillsOptions)
        .exec();

      // Convert to plain objects
      const orderedObjects: IOccupation[] = populated.map((doc) => doc.toObject());

      return {
        items: orderedObjects,
        nextCursor: nextCursorDoc
          ? {
              _id: nextCursorDoc._id.toString(),
              createdAt: this.getCreatedAtFromObjectId(nextCursorDoc._id),
            }
          : null,
      };
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findPaginated: findPaginated failed", { cause: e });
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

  async getOccupationByUUID(occupationUUID: string): Promise<IOccupation | null> {
    try {
      const filter = {
        UUID: { $eq: occupationUUID },
      };
      const occupationInfo = await this.Model.findOne(filter)
        .populate([
          populateOccupationParentOptions,
          populateOccupationChildrenOptions,
          populateOccupationRequiresSkillsOptions,
        ])
        .exec();
      if (occupationInfo == null) {
        return null;
      }
      return occupationInfo.toObject();
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.getOccupationByUUID: getOccupationByUUID failed", {
        cause: e,
      });
      console.error(err);
      throw err;
    }
  }
}
