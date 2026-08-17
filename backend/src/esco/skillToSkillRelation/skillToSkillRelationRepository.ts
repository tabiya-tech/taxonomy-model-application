import mongoose from "mongoose";
import { ISkillDoc } from "esco/skill/_shared/skill.types";
import {
  INewSkillToSkillPairSpec,
  ISkillToSkillRelationPair,
  ISkillToSkillRelationPairDoc,
} from "./skillToSkillRelation.types";

import { ObjectTypes } from "esco/common/objectTypes";
import { isNewSkillToSkillRelationPairSpecValid } from "./skillToSkillRelationValidation";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import stream from "stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";

export interface ISkillToSkillRelationRepository {
  readonly relationModel: mongoose.Model<ISkillToSkillRelationPairDoc>;
  readonly skillModel: mongoose.Model<ISkillDoc>;

  /**
   * Creates multiple new SkillToSkillRelation entries.
   *
   * @param {modelId} modelId - The modelId of the model the relations belong to.
   * @param {INewSkillToSkillPairSpec[]} newSkillToSkillRelationPairSpecs - An array of specifications for the new SkillToSkillRelation entries.
   * @return {Promise<ISkillToSkillRelationPair[]>} - A Promise that resolves to an array containing the newly created SkillToSkillRelation entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(
    modelId: string,
    newSkillToSkillRelationPairSpecs: INewSkillToSkillPairSpec[]
  ): Promise<ISkillToSkillRelationPair[]>;

  /**
   * Updates an existing SkillToSkillRelation entry. The relation is matched by the requiring and required skill pair.
   * @param {string} modelId - The modelId of the model the relation belongs to.
   * @param {INewSkillToSkillPairSpec} spec - The specification of the relation to update.
   * @return {Promise<ISkillToSkillRelationPair | null>} - A Promise that resolves to the updated relation,
   * or null if no existing relation matches the pair.
   */
  updateRelation(modelId: string, spec: INewSkillToSkillPairSpec): Promise<ISkillToSkillRelationPair | null>;

  /**
   * Finds an existing SkillToSkillRelation entry by the requiring and required skill pair.
   * @param {string} modelId - The modelId of the model the relation belongs to.
   * @param {string} requiringSkillId - The ID of the requiring skill.
   * @param {string} requiredSkillId - The ID of the required skill.
   * @return {Promise<ISkillToSkillRelationPair | null>} - A Promise that resolves to the relation,
   * or null if no relation matches the pair.
   */
  findRelation(
    modelId: string,
    requiringSkillId: string,
    requiredSkillId: string
  ): Promise<ISkillToSkillRelationPair | null>;

  /**
   * Returns all SkillToSkillRelation entries as a stream. The entries are transformed to objects (via the .toObject()).
   * @param {string} modelId - The modelId of the occupations.
   * @return {Readable} - A Readable stream of ISkillToSkillRelationPairs
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;
}

export class SkillToSkillRelationRepository implements ISkillToSkillRelationRepository {
  public readonly relationModel: mongoose.Model<ISkillToSkillRelationPairDoc>;
  public readonly skillModel: mongoose.Model<ISkillDoc>;

  constructor(relationModel: mongoose.Model<ISkillToSkillRelationPairDoc>, skillModel: mongoose.Model<ISkillDoc>) {
    this.relationModel = relationModel;
    this.skillModel = skillModel;
  }

  async createMany(
    modelId: string,
    newSkillToSkillRelationPairSpecs: INewSkillToSkillPairSpec[]
  ): Promise<ISkillToSkillRelationPair[]> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) throw new Error(`Invalid modelId: ${modelId}`);
    const newRelationsDocs: mongoose.Document<unknown, unknown, ISkillToSkillRelationPairDoc>[] = [];
    try {
      const existingIds = new Map<string, ObjectTypes[]>();

      // Get all Skills
      const _existingSkillsIds = await this.skillModel
        // use $eq to prevent NoSQL injection
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingSkillsIds.forEach((skill) => existingIds.set(skill._id.toString(), [ObjectTypes.Skill]));

      const newSkillToSkillRelationPairModels = newSkillToSkillRelationPairSpecs
        .filter((spec) => isNewSkillToSkillRelationPairSpecValid(spec, existingIds))
        .map((spec) => {
          try {
            return new this.relationModel({
              ...spec,
              modelId: modelId,
              requiredSkillDocModel: this.skillModel.modelName,
              requiringSkillDocModel: this.skillModel.modelName,
            });
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);

      const docs = await this.relationModel.insertMany(newSkillToSkillRelationPairModels, {
        ordered: false,
      });
      newRelationsDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<ISkillToSkillRelationPairDoc>(
        e,
        "SkillToSkillRelationRepository.createMany",
        newSkillToSkillRelationPairSpecs.length
      );
      newRelationsDocs.push(...docs);
    }

    if (newSkillToSkillRelationPairSpecs.length !== newRelationsDocs.length) {
      console.warn(
        `SkillToSkillRelationRepository.createMany: ${
          newSkillToSkillRelationPairSpecs.length - newRelationsDocs.length
        } invalid entries were not created`
      );
    }
    return newRelationsDocs.map((pair) => pair.toObject());
  }

  async updateRelation(modelId: string, spec: INewSkillToSkillPairSpec): Promise<ISkillToSkillRelationPair | null> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) throw new Error(`Invalid modelId: ${modelId}`);

    const updatedRelation = await this.relationModel
      .findOneAndUpdate(
        {
          modelId: { $eq: modelId },
          requiringSkillId: { $eq: spec.requiringSkillId },
          requiredSkillId: { $eq: spec.requiredSkillId },
        },
        {
          $set: {
            ...spec,
            modelId,
            requiringSkillDocModel: this.skillModel.modelName,
            requiredSkillDocModel: this.skillModel.modelName,
          },
        },
        { new: true, runValidators: true }
      )
      .exec();

    return updatedRelation?.toObject() ?? null;
  }

  async findRelation(
    modelId: string,
    requiringSkillId: string,
    requiredSkillId: string
  ): Promise<ISkillToSkillRelationPair | null> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) throw new Error(`Invalid modelId: ${modelId}`);

    const relation = await this.relationModel
      .findOne({
        modelId: { $eq: modelId },
        requiringSkillId: { $eq: requiringSkillId },
        requiredSkillId: { $eq: requiredSkillId },
      })
      .exec();

    return relation?.toObject() ?? null;
  }

  findAll(modelId: string): Readable {
    try {
      const pipeline = stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.relationModel.find({ modelId: { $eq: modelId } }).cursor(),
        new DocumentToObjectTransformer<ISkillToSkillRelationPair>(),
        () => undefined
      );
      pipeline.on("error", (e) => {
        console.error(new Error("SkillToSkillRelationRepository.findAll: stream failed", { cause: e }));
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("SkillToSkillRelationRepository.findAll: findAll failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
