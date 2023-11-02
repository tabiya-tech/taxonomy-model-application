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
    try {
      const existingIds = new Map<string, ObjectTypes>();

      // Get all Skills
      const _existingSkillsIds = await this.skillModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingSkillsIds.forEach((skill) => existingIds.set(skill._id.toString(), ObjectTypes.Skill));

      // Get all esco occupations
      const _existingOccupationsIds = await this.occupationModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingOccupationsIds.forEach((occupation) =>
        existingIds.set(occupation._id.toString(), ObjectTypes.Occupation)
      );
      // get all local occupations
      // get all localized occupations

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

      const newRelations = await this.relationModel.insertMany(newOccupationToSkillRelationPairModels, {
        ordered: false,
      });
      if (newOccupationToSkillRelationPairSpecs.length !== newRelations.length) {
        console.warn(
          `OccupationToSkillRelationRepository.createMany: ${
            newOccupationToSkillRelationPairSpecs.length - newRelations.length
          } invalid entries were not created`
        );
      }
      return newRelations.map((pair) => pair.toObject());
    } catch (e: unknown) {
      return handleInsertManyError<IOccupationToSkillRelationPair>(
        e,
        "OccupationToSKillRelationRepository.createMany",
        newOccupationToSkillRelationPairSpecs.length
      );
    }
  }
}
