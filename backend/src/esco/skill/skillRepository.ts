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
import { SkillModelPaths } from "./skillModel";
import { Readable } from "node:stream";
import stream from "stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";

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
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    try {
      const newSkillModel = this.newSpecToModel(newSkillSpec);
      await newSkillModel.save();
      await newSkillModel.populate([
        { path: SkillModelPaths.parents },
        { path: SkillModelPaths.children },
        { path: SkillModelPaths.requiresSkills },
        { path: SkillModelPaths.requiredBySkills },
        { path: SkillModelPaths.requiredByOccupations },
      ]);
      return newSkillModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(newSkillSpecs: INewSkillSpec[]): Promise<ISkill[]> {
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
      const newSkills = await this.Model.insertMany(newSkillModels, {
        ordered: false,
        populate: ["parents", "children", "requiresSkills", "requiredBySkills", "requiredByOccupations"], // Populate parents and children fields
      });
      if (newSkillSpecs.length !== newSkills.length) {
        console.warn(
          `SkillRepository.createMany: ${newSkillSpecs.length - newSkills.length} invalid entries were not created`
        );
      }
      return newSkills.map((skill) => skill.toObject());
    } catch (e: unknown) {
      const populationOptions = [
        { path: SkillModelPaths.parents },
        { path: SkillModelPaths.children },
        { path: SkillModelPaths.requiresSkills },
        { path: SkillModelPaths.requiredBySkills },
        { path: SkillModelPaths.requiredByOccupations },
      ];
      return handleInsertManyError<ISkill>(e, "SkillRepository.createMany", newSkillSpecs.length, populationOptions);
    }
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
      console.error("findById failed", e);
      throw e;
    }
  }

  findAll(modelId: string): Readable {
    try {
      return stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({ modelId: { $eq: modelId } }).cursor(),
        // in the current version we do not populate the parents, children
        new DocumentToObjectTransformer<ISkill>(),
        () => undefined
      );
    } catch (e: unknown) {
      console.error("findAll failed", e);
      throw e;
    }
  }
}
