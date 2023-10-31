import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewSkillSpec, ISkill, ISkillDoc } from "./skills.types";
import { populateSkillChildrenOptions, populateSkillParentsOptions } from "./populateSkillHierarchyOptions";
import {
  populateSkillRequiredBySkillsOptions,
  populateSkillRequiresSkillsOptions,
} from "./populateSkillToSkillRelationOptions";
import { populateSkillRequiredByOccupationOptions } from "./populateOccupationToSkillRelationOptions";

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
}

export class SkillRepository implements ISkillRepository {
  public readonly Model: mongoose.Model<ISkillDoc>;

  constructor(model: mongoose.Model<ISkillDoc>) {
    this.Model = model;
  }

  async create(newSkillSpec: INewSkillSpec): Promise<ISkill> {
    //@ts-ignore
    if (newSkillSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    try {
      const newSkillModel = new this.Model({
        ...newSkillSpec,
        UUID: randomUUID(),
      });
      await newSkillModel.save();
      await newSkillModel.populate([
        { path: "parents" },
        { path: "children" },
        { path: "requiresSkills" },
        { path: "requiredBySkills" },
        { path: "requiredByOccupations" },
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
            return new this.Model({
              ...spec,
              UUID: randomUUID(), // override UUID silently
            });
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
      // If the error is a bulk write error, we can still return the created documents
      // Such an error will occur if a unique index is violated
      if ((e as { name?: string }).name === "MongoBulkWriteError") {
        const bulkWriteError = e as mongoose.mongo.MongoBulkWriteError;
        console.warn(
          `SkillRepository.createMany: ${
            newSkillSpecs.length - bulkWriteError.insertedDocs.length
          } invalid entries were not created`,
          e
        );
        const newSkills: ISkill[] = [];
        for await (const doc of bulkWriteError.insertedDocs) {
          await doc.populate([
            { path: "parents" },
            { path: "children" },
            { path: "requiresSkills" },
            { path: "requiredBySkills" },
            { path: "requiredByOccupations" },
          ]);
          newSkills.push(doc.toObject());
        }
        return newSkills;
      }
      console.error("batch create failed", e);
      throw e;
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
}
