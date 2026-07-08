import mongoose, { PipelineStage } from "mongoose";
import { randomUUID } from "crypto";
import {
  INewOccupationSpec,
  INewOccupationSpecWithoutImportId,
  IOccupation,
  IOccupationDoc,
  IPartialUpdateOccupationSpec,
  ISkillWithRelation,
  IUpdateOccupationSpec,
} from "../_shared/occupation.types";
import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import {
  populateOccupationChildrenOptions,
  populateOccupationParentOptions,
} from "../_shared/populate/occupationHierarchyOptions";
import { populateOccupationRequiresSkillsOptions } from "../_shared/populate/occupationToSkillRelationOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import stream from "stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import { populateEmptyOccupationHierarchy } from "esco/occupationHierarchy/populateFunctions";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  populateEmptyRequiredByOccupations,
  populateEmptyRequiresSkills,
} from "esco/occupationToSkillRelation/populateFunctions";
import { populateEmptySkillHierarchy } from "esco/skillHierarchy/populateFunctions";
import { populateEmptySkillToSkillRelation } from "esco/skillToSkillRelation/populateFunctions";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationReference } from "../_shared/occupationReference.types";
import { getOccupationDocReference, OccupationDocument } from "../_shared/occupation.reference";

/**
 * A single UUID from an entity's UUIDHistory resolved to the entity's reference (as it was in that model) and
 * the modelId of the model it belonged to. Both are null when no entity with that UUID exists. Order-preserving
 * against the input UUIDs.
 */
export interface IOccupationModelHistoryReference {
  UUID: string;
  modelId: string | null;
  reference: IOccupationReference | null;
}

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
   * Returns paginated Occupations.
   * @param {string} modelId - The modelId of the Occupations.
   * @param {number} limit - The maximum number of Occupations to return.
   * @param {1 | -1} sortOrder - The sort order for pagination.
   * @param {string} [cursorId] - The ID of the cursor for pagination.
   * @param {Record<string, unknown>} [filter] - Additional filters to apply.
   * @return {Promise<IOccupation[]>} - An array of IOccupations
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>
  ): Promise<IOccupation[]>;

  /**
   * Finds an Occupation entry by it's UUID.
   *
   * @param {string} uuid - The unique UUID of the Occupation entry to find.
   * @return {Promise<IOccupation|null>} - A Promise that resolves to the found Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  getOccupationByUUID(uuid: string): Promise<IOccupation | null>;

  /**
   * Resolves each of the provided occupation UUIDs (an occupation's own UUIDHistory) to the occupation's
   * reference (as it appeared in that model) and the modelId of the model it belonged to.
   * The result is order-preserving against the input UUIDs; entries whose UUID matches no occupation carry
   * null modelId and null reference.
   *
   * @param {string[]} uuids - The occupation UUIDs to resolve.
   * @return {Promise<IOccupationModelHistoryReference[]>} - The resolved reference + modelId per input UUID.
   */
  findHistoryReferencesByUUIDs(uuids: string[]): Promise<IOccupationModelHistoryReference[]>;

  /**
   * Finds the parent Occupation of an Occupation.
   *
   * @param {string} modelId - The modelId of the Occupation.
   * @param {string} occupationId - The ID of the Occupation.
   * @return {Promise<IOccupation | IOccupationGroup | null>} - A Promise that resolves to the parent Occupation or null if not found.
   */
  findParent(modelId: string, occupationId: string): Promise<IOccupation | IOccupationGroup | null>;

  /**
   * Finds the child Occupations of an Occupation.
   *
   * @param {string} modelId - The modelId of the Occupation.
   * @param {string} occupationId - The ID of the Occupation.
   * @param {number} limit - The maximum number of children to return.
   * @param {string} [cursor] - The ID of the cursor for pagination.
   * @return {Promise<IOccupation[]>} - A Promise that resolves to an array containing the child Occupations.
   */
  findChildren(modelId: string, occupationId: string, limit: number, cursor?: string): Promise<IOccupation[]>;

  /**
   * Finds the skills required by an Occupation, with relationship metadata.
   *
   * @param {string} modelId - The modelId of the Occupation.
   * @param {string} occupationId - The ID of the Occupation.
   * @param {number} limit - The maximum number of skills to return.
   * @param {string} [cursor] - The ID of the cursor for pagination.
   * @return {Promise<ISkillWithRelation[]>} - A Promise that resolves to an array of skills with relationship metadata.
   */
  findSkillsForOccupation(
    modelId: string,
    occupationId: string,
    limit: number,
    cursor?: string
  ): Promise<ISkillWithRelation[]>;

  /**
   * Fully replaces the mutable fields of an Occupation (PUT semantics).
   *
   * @param {string} id - The ID of the Occupation to update.
   * @param {IUpdateOccupationSpec} spec - The full set of new field values.
   * @return {Promise<IOccupation | null>} - The updated occupation, or null if not found.
   * Rejects with an error if the operation fails.
   */
  update(id: string, spec: IUpdateOccupationSpec): Promise<IOccupation | null>;

  /**
   * Partially updates an Occupation (PATCH semantics).
   *
   * @param {string} id - The ID of the Occupation to update.
   * @param {IPartialUpdateOccupationSpec} spec - Only the fields to update.
   * @return {Promise<IOccupation | null>} - The updated occupation, or null if not found.
   * Rejects with an error if the operation fails.
   */
  patch(id: string, spec: IPartialUpdateOccupationSpec): Promise<IOccupation | null>;
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
      throw err;
    }

    try {
      const pipeline: Readable = stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({
          modelId: { $eq: modelId },
          ...(filter?.occupationType !== undefined ? { occupationType: { $eq: filter.occupationType } } : {}),
        }).cursor(), // in the current version we do not populate the parent, children or requiresSkills
        new DocumentToObjectTransformer<IOccupation>(),
        () => undefined
      );
      pipeline.on("error", (e) => {
        console.error("OccupationRepository.findAll: stream failed", e);
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findAll: findAll failed", { cause: e });
      throw err;
    }
  }

  async findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>
  ): Promise<IOccupation[]> {
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
        populateOccupationParentOptions,
        populateOccupationChildrenOptions,
        populateOccupationRequiresSkillsOptions,
      ]);

      return populated.map((doc) => doc.toObject());
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findPaginated: findPaginated failed", { cause: e });
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
      throw err;
    }
  }

  async findHistoryReferencesByUUIDs(uuids: string[]): Promise<IOccupationModelHistoryReference[]> {
    try {
      // Pass a bare array (not an explicit { $in: [...] }): mongoose applies $in automatically, and unlike an
      // operator object this is not rewritten by the connection's sanitizeFilter=true.
      const occupations = await this.Model.find(
        { UUID: uuids },
        {
          UUID: 1,
          _id: 1,
          modelId: 1,
          preferredLabel: 1,
          occupationGroupCode: 1,
          code: 1,
          occupationType: 1,
          isLocalized: 1,
        }
      ).exec();
      const byUUID = new Map(occupations.map((occupation) => [occupation.UUID, occupation]));
      // Map over the INPUT uuids to preserve order; null-fill for UUIDs that don't resolve to an occupation.
      return uuids.map((uuid) => {
        const occupation = byUUID.get(uuid);
        if (!occupation) {
          return { UUID: uuid, modelId: null, reference: null };
        }
        // Reuse the shared reference mapper; the reference itself does not carry the modelId, so split it out.
        const { modelId, ...reference } = getOccupationDocReference(occupation as OccupationDocument);
        return { UUID: uuid, modelId: modelId.toString(), reference };
      });
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findHistoryReferencesByUUIDs: findHistoryReferencesByUUIDs failed", {
        cause: e,
      });
      console.error(err);
      throw err;
    }
  }

  async findParent(modelId: string, occupationId: string): Promise<IOccupation | IOccupationGroup | null> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const occupationIdObj = new mongoose.Types.ObjectId(occupationId);

      const pipeline: PipelineStage[] = [
        {
          $match: {
            modelId: modelIdObj,
            childId: occupationIdObj,
            childType: { $in: [ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation] },
          },
        },
        {
          $lookup: {
            from: this.Model.collection.name,
            localField: "parentId",
            foreignField: "_id",
            as: "occupationParent",
          },
        },
        {
          $lookup: {
            from: this.Model.db.model(MongooseModelName.OccupationGroup).collection.name,
            localField: "parentId",
            foreignField: "_id",
            as: "groupParent",
          },
        },
        {
          $addFields: {
            parent: {
              $cond: {
                if: { $eq: ["$parentDocModel", MongooseModelName.Occupation] },
                then: { $arrayElemAt: ["$occupationParent", 0] },
                else: { $arrayElemAt: ["$groupParent", 0] },
              },
            },
          },
        },
        {
          $match: {
            parent: { $ne: null },
          },
        },
        {
          $replaceRoot: {
            newRoot: "$parent",
          },
        },
      ];

      const HierarchyModel = this.Model.db.model(MongooseModelName.OccupationHierarchy);
      // Execute the aggregation pipeline to find and join the parent occupation
      const results = await HierarchyModel.aggregate(pipeline).exec();

      if (results.length === 0) {
        return null;
      }

      const r = results[0];
      const OccupationGroupModel = this.Model.db.model(MongooseModelName.OccupationGroup);

      // Hydrate and populate based on type
      if (r.occupationType === ObjectTypes.ESCOOccupation || r.occupationType === ObjectTypes.LocalOccupation) {
        const doc = this.Model.hydrate(r);
        await doc.populate([populateOccupationChildrenOptions, populateOccupationRequiresSkillsOptions]);
        return doc.toObject();
      } else {
        const doc = OccupationGroupModel.hydrate(r);
        // OccupationGroup doesn't have parent/children/skills to populate in this context
        return doc.toObject();
      }
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findParent: findParent failed", { cause: e });
      throw err;
    }
  }

  async findChildren(modelId: string, occupationId: string, limit: number, cursor?: string): Promise<IOccupation[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const occupationIdObj = new mongoose.Types.ObjectId(occupationId);

      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        parentId: occupationIdObj,
        parentType: { $in: [ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation] },
        childType: { $in: [ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation] },
      };

      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        matchStage.childId = { $gt: new mongoose.Types.ObjectId(cursor) };
      }

      const pipeline: PipelineStage[] = [
        // Match children hierarchy entries with optional cursor for pagination
        {
          $match: matchStage as PipelineStage.Match["$match"],
        },
        // Sort by childId to ensure consistent pagination order
        {
          $sort: { childId: 1 },
        },
        // Limit the results to the requested page size
        {
          $limit: limit,
        },
        // Join with the Occupations collection to get the child details
        {
          $lookup: {
            from: this.Model.collection.name,
            localField: "childId",
            foreignField: "_id",
            as: "child",
          },
        },
        // Flatten the joined 'child' array
        {
          $unwind: "$child",
        },
        // Promote the 'child' sub-document to the root
        {
          $replaceRoot: {
            newRoot: "$child",
          },
        },
      ];

      const HierarchyModel = this.Model.db.model(MongooseModelName.OccupationHierarchy);
      // Execute the aggregation pipeline
      const results = await HierarchyModel.aggregate(pipeline).exec();

      // Hydrate the plain objects into Mongoose documents
      const hydrated = results.map((r) => this.Model.hydrate(r));
      // Load nested relations (parents, children, skills) for each child
      const populated = await this.Model.populate(hydrated, [
        populateOccupationParentOptions,
        populateOccupationChildrenOptions,
        populateOccupationRequiresSkillsOptions,
      ]);

      return populated.map((doc) => doc.toObject());
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findChildren: findChildren failed", { cause: e });
      throw err;
    }
  }

  async findSkillsForOccupation(
    modelId: string,
    occupationId: string,
    limit: number,
    cursor?: string
  ): Promise<ISkillWithRelation[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const occupationIdObj = new mongoose.Types.ObjectId(occupationId);

      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        requiringOccupationId: occupationIdObj,
        requiringOccupationDocModel: MongooseModelName.Occupation,
      };

      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        matchStage.requiredSkillId = { $gt: new mongoose.Types.ObjectId(cursor) };
      }

      const RelationModel = this.Model.db.model(MongooseModelName.OccupationToSkillRelation);
      const SkillModel = this.Model.db.model(MongooseModelName.Skill);

      const pipeline: PipelineStage[] = [
        // Match the relation entries
        {
          $match: matchStage as PipelineStage.Match["$match"],
        },
        // Sort by requiredSkillId to ensure consistent pagination order
        {
          $sort: { requiredSkillId: 1 },
        },
        // Limit the results to the requested page size
        {
          $limit: limit,
        },
        // Join with the Skills collection to get the skill details
        {
          $lookup: {
            from: SkillModel.collection.name,
            localField: "requiredSkillId",
            foreignField: "_id",
            as: "skill",
          },
        },
        // Flatten the joined 'skill' array
        {
          $unwind: "$skill",
        },
        // Project the required fields, merging the skill data with relationship metadata
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                "$skill",
                {
                  relationType: "$relationType",
                  signallingValue: "$signallingValue",
                  signallingValueLabel: "$signallingValueLabel",
                },
              ],
            },
          },
        },
      ];

      // Execute the aggregation pipeline
      const results = await RelationModel.aggregate(pipeline).exec();

      // Hydrate the plain objects into Mongoose documents (using the SkillModel)
      const hydrated = results.map((r) => SkillModel.hydrate(r));

      // Map to objects and populate
      return hydrated.map((doc) => {
        populateEmptySkillHierarchy(doc);
        populateEmptySkillToSkillRelation(doc);
        populateEmptyRequiredByOccupations(doc);
        return doc.toObject() as ISkillWithRelation;
      });
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findSkillsForOccupation: findSkillsForOccupation failed", {
        cause: e,
      });
      throw err;
    }
  }

  async update(id: string, spec: IUpdateOccupationSpec): Promise<IOccupation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await this.Model.findById(id).exec();
      if (!doc) return null;
      doc.set(spec);
      await doc.save();
      await doc.populate([
        populateOccupationParentOptions,
        populateOccupationChildrenOptions,
        populateOccupationRequiresSkillsOptions,
      ]);
      return doc.toObject();
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.update: update failed.", { cause: e });
      throw err;
    }
  }

  async patch(id: string, spec: IPartialUpdateOccupationSpec): Promise<IOccupation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await this.Model.findById(id).exec();
      if (!doc) return null;
      doc.set(spec);
      await doc.save();
      await doc.populate([
        populateOccupationParentOptions,
        populateOccupationChildrenOptions,
        populateOccupationRequiresSkillsOptions,
      ]);
      return doc.toObject();
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.patch: patch failed.", { cause: e });
      throw err;
    }
  }
}
