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
import { IOccupationDoc } from "esco/occupation/occupation.types";
import { getModelName } from "esco/common/mongooseModelNames";
import { ILocalizedOccupationDoc } from "esco/localizedOccupation/localizedOccupation.types";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";

export interface IOccupationToSkillRelationRepository {
  readonly relationModel: mongoose.Model<IOccupationToSkillRelationPairDoc>;
  readonly skillModel: mongoose.Model<ISkillDoc>;
  readonly occupationModel: mongoose.Model<IOccupationDoc>;
  readonly localizedOccupationModel: mongoose.Model<ILocalizedOccupationDoc>;

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
  public readonly localizedOccupationModel: mongoose.Model<ILocalizedOccupationDoc>;

  constructor(
    relationModel: mongoose.Model<IOccupationToSkillRelationPairDoc>,
    skillModel: mongoose.Model<ISkillDoc>,
    occupationModel: mongoose.Model<IOccupationDoc>,
    localizedOccupationModel: mongoose.Model<ILocalizedOccupationDoc>
  ) {
    this.relationModel = relationModel;
    this.skillModel = skillModel;
    this.occupationModel = occupationModel;
    this.localizedOccupationModel = localizedOccupationModel;
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
      const existingIds = new Map<string, [ObjectTypes]>();

      // Get all Skills
      const _existingSkillsIds = await this.skillModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingSkillsIds.forEach((skill) => existingIds.set(skill._id.toString(), [ObjectTypes.Skill]));

      // Get all esco occupations
      const _existingOccupationsIds = await this.occupationModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingOccupationsIds.forEach((occupation) =>
        existingIds.set(occupation._id.toString(), [ObjectTypes.Occupation])
      );
      // get all localized occupations
      const _existingLocalizedOccupationIds = await this.localizedOccupationModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingLocalizedOccupationIds.forEach((localizedOccupation) =>
        existingIds.set(localizedOccupation._id.toString(), [ObjectTypes.Occupation])
      );

      const newOccupationToSkillRelationPairModels = newOccupationToSkillRelationPairSpecs
        .filter((spec) => isNewOccupationToSkillRelationPairSpecValid(spec, existingIds))
        .map((spec) => {
          try {
            return new this.relationModel({
              ...spec,
              modelId: modelId,
              requiringOccupationDocModel: getModelName(spec.requiringOccupationType),
              requiredSkillDocModel: this.skillModel.modelName,
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
      return stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.relationModel.find({ modelId: { $eq: modelId } }).cursor(),
        new DocumentToObjectTransformer<IOccupationToSkillRelationPair>(),
        () => undefined
      );
    } catch (e: unknown) {
      console.error("findAll failed", e);
      throw e;
    }
  }
}
