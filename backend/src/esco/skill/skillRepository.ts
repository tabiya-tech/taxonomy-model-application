import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewSkillSpec, ISkill, ISkillDoc } from "./skills.types";
import { ISkillGroup } from "esco/skillGroup/skillGroup.types";
import { IOccupationReference } from "esco/occupations/occupationReference.types";
import { SkillToSkillReferenceWithRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import { OccupationToSkillReferenceWithRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ObjectTypes } from "esco/common/objectTypes";
import { populateSkillChildrenOptions, populateSkillParentsOptions } from "./populateSkillHierarchyOptions";
import {
  populateSkillGroupChildrenOptions,
  populateSkillGroupParentsOptions,
} from "esco/skillGroup/populateSkillHierarchyOptions";
import {
  populateSkillRequiredBySkillsOptions,
  populateSkillRequiresSkillsOptions,
} from "./populateSkillToSkillRelationOptions";
import { populateSkillRequiredByOccupationOptions } from "./populateOccupationToSkillRelationOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import stream from "stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import { populateEmptySkillHierarchy } from "esco/skillHierarchy/populateFunctions";
import { populateEmptySkillToSkillRelation } from "esco/skillToSkillRelation/populateFunctions";
import { populateEmptyRequiredByOccupations } from "esco/occupationToSkillRelation/populateFunctions";

export interface ISkillRepository {
  readonly Model: mongoose.Model<ISkillDoc>;

  /**
   * Creates a new Skill entry.
   *
   * @param {INewSkillSpec} newSkillSpec - The specification for the new Skill entry.
   * @return {Promise<INewSkillSpec>} - A Promise that resolves to the newly created Skill entry.
   * Rejects with an error if the Skill entry cannot be created due to reasons other than validation.
   */
  create(newSkillSpec: INewSkillSpec): Promise<ISkill>;

  /**
   * Creates multiple new Skill entries.
   *
   * @param {INewSkillSpec[]} newSkillSpecs - An array of specifications for the new Skill entries.
   * @return {Promise<ISkill[]>} - A Promise that resolves to an array containing the newly created Skill entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newSkillSpecs: INewSkillSpec[]): Promise<ISkill[]>;

  /**
   * Finds a Skill entry by its ID.
   *
   * @param {string} id - The unique ID of the Skill entry.
   * @return {Promise<ISkill|null>} - A Promise that resolves to the found Skill entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<ISkill | null>;

  /**
   * Returns all Skills as a stream. The Skills are transformed to objects (via the .toObject()), however
   * in the current version they are not populated with parents, children, requiresSkills, requiredBySkills or requiredByOccupations. This will be implemented in a future version.
   * @param {string} modelId - The modelId of the Skills.
   * @return {Readable} - A Readable stream of ISkill
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;

  /**
   * Returns paginated Skills with parents, children, requiresSkills, requiredBySkills and requiredByOccupations populated.
   *
   * @param {string} modelId - The modelId of the Skills.
   * @param {number} limit - The maximum number of Skills to return.
   * @param {1 | -1} sortOrder - Sort direction: 1 ascending (oldest first), -1 descending (newest first). Applied to createdAt and _id.
   * @param {{ id: string; createdAt: Date }} [cursor] - The cursor for pagination, containing the ID and createdAt of the last retrieved item.
   * @return {Promise<ISkill[]>} - A Promise that resolves to an array of Skills.
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    limit: number,
    sortOrder: -1 | 1,
    cursor?: { id: string; createdAt: Date }
  ): Promise<ISkill[]>;

  /**
   * Finds the parent Skills or SkillGroups of a Skill or SkillGroup.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill or SkillGroup.
   * @return {Promise<(ISkill | ISkillGroup)[]>} - A Promise that resolves to the parents.
   */
  findParents(modelId: string, skillId: string, limit: number, cursor?: string): Promise<(ISkill | ISkillGroup)[]>;

  /**
   * Finds the child Skills or SkillGroups of a Skill.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @param {number} limit - The maximum number of children to return.
   * @param {string} [cursor] - The ID of the cursor for pagination.
   * @return {Promise<(ISkill | ISkillGroup)[]>} - A Promise that resolves to an array containing the child Skills or SkillGroups.
   */
  findChildren(modelId: string, skillId: string, limit: number, cursor?: string): Promise<(ISkill | ISkillGroup)[]>;

  /**
   * Finds the occupations that require a Skill with relationship metadata.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @param {number} limit - The maximum number of occupations to return.
   * @param {string} [cursor] - The ID of the cursor for pagination.
   * @return {Promise<OccupationToSkillReferenceWithRelationType<IOccupationReference>[]>} - A Promise that resolves to an array containing the occupations.
   */
  findOccupationsForSkill(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<OccupationToSkillReferenceWithRelationType<IOccupationReference>[]>;

  /**
   * Finds the related skills of a Skill with relationship metadata.
   *
   * @param {string} modelId - The modelId of the Skill.
   * @param {string} skillId - The ID of the Skill.
   * @param {number} limit - The maximum number of related skills to return.
   * @param {string} [cursor] - The ID of the cursor for pagination.
   * @return {Promise<SkillToSkillReferenceWithRelationType<ISkill>[]>} - A Promise that resolves to an array containing the related skills.
   */
  findRelatedSkills(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<SkillToSkillReferenceWithRelationType<ISkill>[]>;
}

export class SkillRepository implements ISkillRepository {
  public readonly Model: mongoose.Model<ISkillDoc>;

  constructor(model: mongoose.Model<ISkillDoc>) {
    this.Model = model;
  }

  private newSpecToModel(newSpec: INewSkillSpec): mongoose.HydratedDocument<ISkillDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newSkillSpec: INewSkillSpec): Promise<ISkill> {
    //@ts-ignore
    if (newSkillSpec.UUID !== undefined) {
      const err = new Error("SkillRepository.createMany: create failed. UUID should not be provided");
      console.error(err);
      throw err;
    }

    try {
      const newSkillModel = this.newSpecToModel(newSkillSpec);
      await newSkillModel.save();
      populateEmptySkillHierarchy(newSkillModel);
      populateEmptySkillToSkillRelation(newSkillModel);
      populateEmptyRequiredByOccupations(newSkillModel);
      return newSkillModel.toObject();
    } catch (e: unknown) {
      const err = new Error("SkillRepository.createMany: create failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async createMany(newSkillSpecs: INewSkillSpec[]): Promise<ISkill[]> {
    const newSkillsDocuments: mongoose.Document<unknown, unknown, ISkillDoc>[] = [];
    try {
      const newSkillModels = newSkillSpecs
        .map((spec) => {
          try {
            return this.newSpecToModel(spec);
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const docs = await this.Model.insertMany(newSkillModels, {
        ordered: false,
      });
      newSkillsDocuments.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<ISkillDoc>(e, "SkillRepository.createMany", newSkillSpecs.length);
      newSkillsDocuments.push(...docs);
    }
    if (newSkillSpecs.length !== newSkillsDocuments.length) {
      console.warn(
        `SkillRepository.createMany: ${
          newSkillSpecs.length - newSkillsDocuments.length
        } invalid entries were not created`
      );
    }
    return newSkillsDocuments.map((skill) => {
      populateEmptySkillHierarchy(skill);
      populateEmptySkillToSkillRelation(skill);
      populateEmptyRequiredByOccupations(skill);
      return skill.toObject();
    });
  }

  async findById(id: string): Promise<ISkill | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;

      const skill = await this.Model.findById(id)
        .populate(populateSkillParentsOptions)
        .populate(populateSkillChildrenOptions)
        .populate(populateSkillRequiresSkillsOptions)
        .populate(populateSkillRequiredBySkillsOptions)
        .populate(populateSkillRequiredByOccupationOptions)
        .exec();

      return skill !== null ? skill.toObject() : null;
    } catch (e: unknown) {
      const err = new Error("SkillRepository.findById: findById failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  findAll(modelId: string): Readable {
    try {
      const pipeline = stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({ modelId: { $eq: modelId } }).cursor(),
        // in the current version we do not populate the parents, children
        new DocumentToObjectTransformer<ISkill>(),
        () => undefined
      );

      pipeline.on("error", (e) => {
        console.error(new Error("SkillRepository.findAll: stream failed", { cause: e }));
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("SkillRepository.findAll: findAll failed", { cause: e });
      console.error(err);
      throw e;
    }
  }

  async findPaginated(
    modelId: string,
    limit: number,
    sortOrder: -1 | 1,
    cursor?: { id: string; createdAt: Date }
  ): Promise<ISkill[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      // Build the match stage
      const matchStage: mongoose.FilterQuery<ISkillDoc> = { modelId: modelIdObj };

      // If a cursor is provided, add it to the match stage to get results after the cursor
      if (cursor && mongoose.Types.ObjectId.isValid(cursor.id)) {
        const id = new mongoose.Types.ObjectId(cursor.id);
        const createdAt = cursor.createdAt;
        const operator = sortOrder === -1 ? "$lt" : "$gt";
        matchStage.$or = [{ createdAt: { [operator]: createdAt } }, { createdAt: createdAt, _id: { [operator]: id } }];
      }

      // Execute the aggregation pipeline
      // We use aggregation to handle filtering, sorting and limiting in a single query
      const results = await this.Model.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: sortOrder, _id: sortOrder } },
        { $limit: limit },
      ]).exec();

      // Hydrate the aggregation results to Mongoose documents
      // This is necessary because aggregate() returns plain objects, but populate() requires Mongoose documents
      const hydrated = results.map((r) => this.Model.hydrate(r));
      const populated = await this.Model.populate(hydrated, [
        populateSkillParentsOptions,
        populateSkillChildrenOptions,
        populateSkillRequiresSkillsOptions,
        populateSkillRequiredBySkillsOptions,
        populateSkillRequiredByOccupationOptions,
      ]);

      return populated.map((doc) => doc.toObject());
    } catch (e: unknown) {
      const err = new Error("SkillRepository.findPaginated: findPaginated failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findParents(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<(ISkill | ISkillGroup)[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const skillIdObj = new mongoose.Types.ObjectId(skillId);

      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        childId: skillIdObj,
        childType: { $in: [ObjectTypes.Skill, ObjectTypes.SkillGroup] },
      };

      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        matchStage.parentId = { $gt: new mongoose.Types.ObjectId(cursor) };
      }

      const SkillGroupModel = this.Model.db.model(MongooseModelName.SkillGroup);

      const pipeline: mongoose.PipelineStage[] = [
        { $match: matchStage as mongoose.PipelineStage.Match["$match"] },
        { $sort: { parentId: 1 } },
        { $limit: limit },
        {
          $lookup: {
            from: this.Model.collection.name,
            localField: "parentId",
            foreignField: "_id",
            as: "skillParent",
          },
        },
        {
          $lookup: {
            from: SkillGroupModel.collection.name,
            localField: "parentId",
            foreignField: "_id",
            as: "groupParent",
          },
        },
        {
          $addFields: {
            parent: {
              $cond: {
                if: { $eq: ["$parentDocModel", MongooseModelName.Skill] },
                then: { $arrayElemAt: ["$skillParent", 0] },
                else: { $arrayElemAt: ["$groupParent", 0] },
              },
            },
          },
        },
        { $match: { parent: { $ne: null } } },
        { $replaceRoot: { newRoot: "$parent" } },
      ];

      const HierarchyModel = this.Model.db.model(MongooseModelName.SkillHierarchy);
      const results = await HierarchyModel.aggregate(pipeline).exec();

      const hydrated = results.map((r) => {
        if (r.skillType !== undefined) {
          return this.Model.hydrate(r);
        }
        return SkillGroupModel.hydrate(r);
      });

      const skills = hydrated.filter(
        (doc): doc is mongoose.HydratedDocument<ISkillDoc> =>
          (doc as mongoose.Document & { skillType?: string }).skillType !== undefined
      );
      const skillGroups = hydrated.filter(
        (doc) => (doc as mongoose.Document & { skillType?: string }).skillType === undefined
      );

      if (skills.length > 0) {
        await this.Model.populate(skills, [
          populateSkillParentsOptions,
          populateSkillChildrenOptions,
          populateSkillRequiresSkillsOptions,
          populateSkillRequiredBySkillsOptions,
          populateSkillRequiredByOccupationOptions,
        ]);
      }
      if (skillGroups.length > 0) {
        await SkillGroupModel.populate(skillGroups, [
          populateSkillGroupParentsOptions,
          populateSkillGroupChildrenOptions,
        ]);
      }

      return hydrated.map((doc) => doc.toObject() as ISkill | ISkillGroup);
    } catch (e: unknown) {
      const err = new Error("SkillRepository.findParents: findParents failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findChildren(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<(ISkill | ISkillGroup)[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const skillIdObj = new mongoose.Types.ObjectId(skillId);

      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        parentId: skillIdObj,
        parentType: { $in: [ObjectTypes.Skill, ObjectTypes.SkillGroup] },
      };

      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        matchStage.childId = { $gt: new mongoose.Types.ObjectId(cursor) };
      }

      const SkillGroupModel = this.Model.db.model(MongooseModelName.SkillGroup);

      const pipeline: mongoose.PipelineStage[] = [
        { $match: matchStage as mongoose.PipelineStage.Match["$match"] },
        { $sort: { childId: 1 } },
        { $limit: limit },
        {
          $lookup: {
            from: this.Model.collection.name,
            localField: "childId",
            foreignField: "_id",
            as: "skillChild",
          },
        },
        {
          $lookup: {
            from: SkillGroupModel.collection.name,
            localField: "childId",
            foreignField: "_id",
            as: "groupChild",
          },
        },
        {
          $addFields: {
            child: {
              $cond: {
                if: { $eq: ["$childDocModel", MongooseModelName.Skill] },
                then: { $arrayElemAt: ["$skillChild", 0] },
                else: { $arrayElemAt: ["$groupChild", 0] },
              },
            },
          },
        },
        { $match: { child: { $ne: null } } },
        { $replaceRoot: { newRoot: "$child" } },
      ];

      const HierarchyModel = this.Model.db.model(MongooseModelName.SkillHierarchy);
      const results = await HierarchyModel.aggregate(pipeline).exec();

      const hydrated = results.map((r) => {
        if (r.skillType !== undefined) {
          return this.Model.hydrate(r);
        }
        return SkillGroupModel.hydrate(r);
      });

      const skills = hydrated.filter(
        (doc): doc is mongoose.HydratedDocument<ISkillDoc> =>
          (doc as mongoose.Document & { skillType?: string }).skillType !== undefined
      );
      const skillGroups = hydrated.filter(
        (doc) => (doc as mongoose.Document & { skillType?: string }).skillType === undefined
      );

      if (skills.length > 0) {
        await this.Model.populate(skills, [
          populateSkillParentsOptions,
          populateSkillChildrenOptions,
          populateSkillRequiresSkillsOptions,
          populateSkillRequiredBySkillsOptions,
          populateSkillRequiredByOccupationOptions,
        ]);
      }
      if (skillGroups.length > 0) {
        await SkillGroupModel.populate(skillGroups, [
          populateSkillGroupParentsOptions,
          populateSkillGroupChildrenOptions,
        ]);
      }

      return hydrated.map((doc) => doc.toObject() as ISkill | ISkillGroup);
    } catch (e: unknown) {
      const err = new Error("SkillRepository.findChildren: findChildren failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findOccupationsForSkill(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<OccupationToSkillReferenceWithRelationType<IOccupationReference>[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const skillIdObj = new mongoose.Types.ObjectId(skillId);

      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        requiredSkillId: skillIdObj,
        requiredSkillDocModel: MongooseModelName.Skill,
      };

      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        matchStage.requiringOccupationId = { $gt: new mongoose.Types.ObjectId(cursor) };
      }

      const OccupationModel = this.Model.db.model(MongooseModelName.Occupation);

      const pipeline: mongoose.PipelineStage[] = [
        { $match: matchStage as mongoose.PipelineStage.Match["$match"] },
        { $sort: { requiringOccupationId: 1 } },
        { $limit: limit },
        {
          $lookup: {
            from: OccupationModel.collection.name,
            localField: "requiringOccupationId",
            foreignField: "_id",
            as: "occupation",
          },
        },
        { $unwind: "$occupation" },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                "$occupation",
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
      const results = await RelationModel.aggregate(pipeline).exec();

      return results.map((r) => {
        const doc = OccupationModel.hydrate(r);
        return {
          ...doc.toObject(),
          relationType: r.relationType,
          signallingValue: r.signallingValue,
          signallingValueLabel: r.signallingValueLabel,
        } as OccupationToSkillReferenceWithRelationType<IOccupationReference>;
      });
    } catch (e: unknown) {
      const err = new Error("SkillRepository.findOccupationsForSkill: findOccupationsForSkill failed", { cause: e });
      console.error(err);
      throw err;
    }
  }

  async findRelatedSkills(
    modelId: string,
    skillId: string,
    limit: number,
    cursor?: string
  ): Promise<SkillToSkillReferenceWithRelationType<ISkill>[]> {
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const skillIdObj = new mongoose.Types.ObjectId(skillId);

      // We need to find both directions: required skills and skills that require this skill
      // This is a bit more complex. Let's start with one direction or simplify.
      // Usually "related" in ESCO means non-hierarchical relations.

      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        $or: [{ requiringSkillId: skillIdObj }, { requiredSkillId: skillIdObj }],
      };

      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        // Pagination for $or is tricky. For now let's just use the relation ID as cursor.
        matchStage._id = { $gt: new mongoose.Types.ObjectId(cursor) };
      }

      const pipeline: mongoose.PipelineStage[] = [
        { $match: matchStage as mongoose.PipelineStage.Match["$match"] },
        { $sort: { _id: 1 } },
        { $limit: limit },
        {
          $lookup: {
            from: this.Model.collection.name,
            localField: "requiringSkillId",
            foreignField: "_id",
            as: "requiringSkill",
          },
        },
        {
          $lookup: {
            from: this.Model.collection.name,
            localField: "requiredSkillId",
            foreignField: "_id",
            as: "requiredSkill",
          },
        },
        {
          $addFields: {
            relatedSkill: {
              $cond: {
                if: { $eq: ["$requiringSkillId", skillIdObj] },
                then: { $arrayElemAt: ["$requiredSkill", 0] },
                else: { $arrayElemAt: ["$requiringSkill", 0] },
              },
            },
          },
        },
        { $match: { relatedSkill: { $ne: null } } },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ["$relatedSkill", { relationType: "$relationType", relationId: "$_id" }],
            },
          },
        },
      ];

      const RelationModel = this.Model.db.model(MongooseModelName.SkillToSkillRelation);
      const results = await RelationModel.aggregate(pipeline).exec();

      return results.map((r) => {
        const doc = this.Model.hydrate(r);
        populateEmptySkillHierarchy(doc);
        populateEmptySkillToSkillRelation(doc);
        populateEmptyRequiredByOccupations(doc);
        const relationId = typeof r.relationId === "string" ? r.relationId : r.relationId?.toString();
        return {
          ...doc.toObject(),
          relationType: r.relationType,
          relationId,
        } as SkillToSkillReferenceWithRelationType<ISkill> & { relationId: string };
      });
    } catch (e: unknown) {
      const err = new Error("SkillRepository.findRelatedSkills: findRelatedSkills failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
