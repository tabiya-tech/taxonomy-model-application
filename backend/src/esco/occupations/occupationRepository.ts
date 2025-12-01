import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewOccupationSpec, INewOccupationSpecWithoutImportId, IOccupation, IOccupationDoc } from "./occupation.types";
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
   * @param {INewOccupationSpecWithoutImportId} newOccupationSpec - The specification for the new Occupation entry.
   * @return {Promise<IOccupation>} - A Promise that resolves to the newly created Occupation entry.
   * Rejects with an error if the Occupation entry cannot be created ue to reasons other than validation.
   */
  create(newOccupationSpec: INewOccupationSpecWithoutImportId): Promise<IOccupation>;

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
   * Returns all occupations as a stream. The Occupations are transformed to objects (via the .toObject()), however
   * in the current version they are not populated with parents, children or required skills.This will be implemented in a future version.
   * @param {string} modelId - The modelId of the occupations.
   * @param {SearchFilter} filter - Used for restricting the search.
   * @return {Readable} - A Readable stream of IOccupations
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string, filter?: SearchFilter): Readable;

  /**
   * Returns paginated Occupations. The Occupations are transformed to objects (via .lean()), however
   * in the current version they are not populated with parents or children. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the Occupations.
   * @param {object} filter - The filter for pagination.
   * @param {object} sort - The sort order for pagination.
   * @param {number} limit - The maximum number of Occupations to return.
   * @return {Promise<IOccupation[]>} - An array of IOccupations
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    filter: Record<string, unknown>,
    sort: { _id: 1 | -1 },
    limit: number
  ): Promise<IOccupation[]>;

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

  private newSpecWithoutImportIdToModel(
    newSpec: INewOccupationSpecWithoutImportId
  ): mongoose.HydratedDocument<IOccupationDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
      importId: null,
    });
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newOccupationSpec: INewOccupationSpecWithoutImportId): Promise<IOccupation> {
    //@ts-ignore
    if (newOccupationSpec.UUID !== undefined) {
      const err = new Error("OccupationRepository.create: create failed. UUID should not be provided.");
      console.error(err);
      throw err;
    }

    try {
      const newOccupationModel = this.newSpecWithoutImportIdToModel(newOccupationSpec);
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
        }).cursor(), // in the current version we do not populate the parent, children or requiresSkills
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
    filter: Record<string, unknown>,
    sort: { _id: 1 | -1 },
    limit: number
  ): Promise<IOccupation[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);

      // Build aggregation pipeline
      const matchStage: Record<string, unknown> = { modelId: modelIdObj, ...filter };

      // NOTE: We are sending 2 database queries, this is not efficient. This is because mongoose is throwing
      //       an error when trying to query by _id, using $gt or $lt: ISSUE: https://github.com/Automattic/mongoose/issues/2277#event-171765301
      //       We are creating to optimize this luxurious improvement.
      //       https://tabiya-tech.atlassian.net/browse/TAX-31

      // Get exactly limit items
      const results = await this.Model.aggregate([{ $match: matchStage }, { $sort: sort }, { $limit: limit }]).exec();

      // populate parent and children for the page items using existing populate options
      const idsInOrder = results.map((d: { _id: mongoose.Types.ObjectId }) => d._id.toString());
      const objectIds = idsInOrder.map((id: string) => new mongoose.Types.ObjectId(id));
      // NOTE: query the page docs and let MongoDB return them already ordered by _id
      const populated = await this.Model.find({ _id: objectIds })
        .sort(sort)
        .populate(populateOccupationParentOptions)
        .populate(populateOccupationChildrenOptions)
        .populate(populateOccupationRequiresSkillsOptions)
        .exec();

      // Convert to plain objects
      return populated.map((doc: mongoose.Document<unknown, unknown, IOccupationDoc>) => doc.toObject());
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findPaginated: findPaginated failed", { cause: e });
      console.error(err);
      throw err;
    }
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
