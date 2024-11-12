import mongoose from "mongoose";
import { ISkillDoc } from "esco/skill/skills.types";

import { ObjectTypes } from "esco/common/objectTypes";
import { isNewOccupationToSkillRelationPairSpecValid } from "./occupationToSkillRelationValidation";
import {
  INewOccupationToSkillPairSpec,
  IOccupationToSkillRelationPair,
  IOccupationToSkillRelationPairDoc,
} from "./occupationToSkillRelation.types";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { IOccupationDoc } from "esco/occupations/occupation.types";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";
import { MongooseModelName } from "esco/common/mongooseModelNames";

export interface IOccupationToSkillRelationRepository {
  readonly relationModel: mongoose.Model<IOccupationToSkillRelationPairDoc>;
  readonly skillModel: mongoose.Model<ISkillDoc>;
  readonly occupationModel: mongoose.Model<IOccupationDoc>;

  /**
   * Creates multiple new OccupationToSkillRelation entries.
   *
   * @param {modelId} modelId - The modelId of the model the relations belong to.
   * @param {INewOccupationToSkillPairSpec[]} newOccupationToSkillRelationPairSpecs - An array of specifications for the new OccupationToSkillRelation entries.
   * @return {Promise<IOccupationToSkillRelationPair[]>} - A Promise that resolves to an array containing the newly created OccupationToSkillRelation entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(
    modelId: string,
    newOccupationToSkillRelationPairSpecs: INewOccupationToSkillPairSpec[]
  ): Promise<IOccupationToSkillRelationPair[]>;

  /**
   * Returns all OccupationToSkillRelation entries as a stream. The entries are transformed to objects (via the .toObject()).
   * @param {string} modelId - The modelId of the occupations.
   * @return {Readable} - A Readable stream of IOccupationToSkillRelationPairs
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;
}

export class OccupationToSkillRelationRepository implements IOccupationToSkillRelationRepository {
  public readonly relationModel: mongoose.Model<IOccupationToSkillRelationPairDoc>;
  public readonly skillModel: mongoose.Model<ISkillDoc>;
  public readonly occupationModel: mongoose.Model<IOccupationDoc>;

  constructor(
    relationModel: mongoose.Model<IOccupationToSkillRelationPairDoc>,
    skillModel: mongoose.Model<ISkillDoc>,
    occupationModel: mongoose.Model<IOccupationDoc>
  ) {
    this.relationModel = relationModel;
    this.skillModel = skillModel;
    this.occupationModel = occupationModel;
  }

  async createMany(
    modelId: string,
    newOccupationToSkillRelationPairSpecs: INewOccupationToSkillPairSpec[]
  ): Promise<IOccupationToSkillRelationPair[]> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      const err = new Error(`Invalid modelId: ${modelId}`);
      console.error("batch create failed", err);
      throw err;
    }
    const newRelationsDocs: mongoose.Document<unknown, unknown, IOccupationToSkillRelationPairDoc>[] = [];
    try {
      const existingIds = new Map<string, ObjectTypes[]>();

      // Get all Skills
      const _existingSkillsIds = await this.skillModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingSkillsIds.forEach((skill) => existingIds.set(skill._id.toString(), [ObjectTypes.Skill]));

      // Get all esco and local occupations
      const _existingOccupationsIds = await this.occupationModel
        .find({ modelId: { $eq: modelId } })
        .select("_id occupationType")
        .exec();
      _existingOccupationsIds.forEach((occupation) => {
        const types = existingIds.get(occupation._id.toString());
        if (types !== undefined) {
          // there is already a value for this key, and it should be a skill,
          // so we add the occupation type to the array
          types.push(occupation.occupationType);
        } else {
          existingIds.set(occupation._id.toString(), [occupation.occupationType]);
        }
      });

      const newOccupationToSkillRelationPairModels = newOccupationToSkillRelationPairSpecs
        .filter((spec) => {
         const valid = isNewOccupationToSkillRelationPairSpecValid(spec, existingIds);
          if (!valid) {
            console.warn("OccupationToSkillRelationRepository.createMany: invalid entry", spec);
          }
          return valid;
        })
        .map((spec) => {
          try {
            return new this.relationModel({
              ...spec,
              modelId: modelId,
              requiringOccupationDocModel: MongooseModelName.Occupation,
              requiredSkillDocModel: MongooseModelName.Skill,
            });
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);

      const docs = await this.relationModel.insertMany(newOccupationToSkillRelationPairModels, {
        ordered: false,
      });
      newRelationsDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<IOccupationToSkillRelationPairDoc>(
        e,
        "OccupationToSKillRelationRepository.createMany",
        newOccupationToSkillRelationPairSpecs.length
      );
      newRelationsDocs.push(...docs);
    }

    if (newOccupationToSkillRelationPairSpecs.length !== newRelationsDocs.length) {
      console.warn(
        `OccupationToSkillRelationRepository.createMany: ${
          newOccupationToSkillRelationPairSpecs.length - newRelationsDocs.length
        } invalid entries were not created`
      );
    }
    return newRelationsDocs.map((pair) => pair.toObject());
  }

  findAll(modelId: string): Readable {
    try {
      const pipeline = stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.relationModel.find({ modelId: { $eq: modelId } }).cursor(),
        new DocumentToObjectTransformer<IOccupationToSkillRelationPair>(),
        () => undefined
      );
      pipeline.on("error", (e) => {
        console.error(new Error("OccupationToSkillRelationRepository.findAll: stream failed", { cause: e }));
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("OccupationToSkillRelationRepository.findAll: findAll failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
