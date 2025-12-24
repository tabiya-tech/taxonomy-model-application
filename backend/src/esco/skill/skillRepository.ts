import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewSkillSpec, ISkill, ISkillDoc } from "./skills.types";
import { populateSkillChildrenOptions, populateSkillParentsOptions } from "./populateSkillHierarchyOptions";
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
   * Returns paginated Skills. The Skills are transformed to objects (via .lean()), however
   * in the current version they are not populated with parents, children, requiresSkills, requiredBySkills or requiredByOccupations.
   *
   * @param {string} modelId - The modelId of the Skills.
   * @param {Record<string, unknown>} filter - The filter to apply to the query.
   * @param {{ _id: 1 | -1 }} sort - The sort order to apply to the query.
   * @param {number} limit - The maximum number of Skills to return.
   * @return {Promise<ISkill[]>} - A Promise that resolves to an array of Skills.
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>
  ): Promise<ISkill[]>;
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
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>
  ): Promise<ISkill[]> {
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
}
