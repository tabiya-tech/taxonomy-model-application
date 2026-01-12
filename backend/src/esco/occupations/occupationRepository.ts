import mongoose, { PipelineStage } from "mongoose";
import { randomUUID } from "crypto";
import { INewOccupationSpec, INewOccupationSpecWithoutImportId, IOccupation, IOccupationDoc } from "./occupation.types";
import { IOccupationGroup } from "../occupationGroup/OccupationGroup.types";
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
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillWithRelation } from "./occupationService.types";
import {
  populateEmptyRequiredByOccupations,
  populateEmptyRequiresSkills,
} from "esco/occupationToSkillRelation/populateFunctions";
import { populateEmptySkillHierarchy } from "esco/skillHierarchy/populateFunctions";
import { populateEmptySkillToSkillRelation } from "esco/skillToSkillRelation/populateFunctions";
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
   * Finds the skills for an occupation.
   *
   * @param {string} modelId - The modelId of the skill.
   * @param {string} occupationId - The ID of the occupation.
   * @param {number} limit - The maximum number of skills to return.
   * @param {string} [cursor] - The ID of the cursor for pagination.
   * @return {Promise<ISkillWithRelation[]>} - A Promise that resolves to an array containing the skills for the occupation.
   */
  findSkillsForOccupation(
    modelId: string,
    occupationId: string,
    limit: number,
    cursor?: string
  ): Promise<ISkillWithRelation[]>;
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

      // Log warning if multiple parents found (should only have one parent)
      if (results.length > 1) {
        console.warn(
          `OccupationRepository.findParent: Multiple parents (${results.length}) found for occupation ${occupationId}. Using first result.`
        );
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
      console.error(err);
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
      console.error(err);
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

      const RelationModel = this.Model.db.model(MongooseModelName.OccupationToSkillRelation);
      // Execute the aggregation pipeline
      const results = await RelationModel.aggregate(pipeline).exec();

      // Hydrate the plain objects into Mongoose documents (using the SkillModel)
      // Hydrate the plain objects into Mongoose documents (using the SkillModel)
      const hydrated = results.map((r) => SkillModel.hydrate(r));

      // Return the objects
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
      console.error(err);
      throw err;
    }
  }
}
