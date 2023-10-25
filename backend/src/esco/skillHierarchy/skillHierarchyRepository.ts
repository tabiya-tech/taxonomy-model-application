import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillDoc } from "esco/skill/skills.types";
import { INewSkillHierarchyPairSpec, ISkillHierarchyPair, ISkillHierarchyPairDoc } from "./skillHierarchy.types";
import { ISkillGroupDoc } from "esco/skillGroup/skillGroup.types";
import { isHierarchyPairValid } from "esco/common/hierarchy";

export interface ISkillHierarchyRepository {
  readonly hierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>;
  readonly skillModel: mongoose.Model<ISkillDoc>;
  readonly skillGroupModel: mongoose.Model<ISkillGroupDoc>;

  /**
   * Creates multiple new SkillHierarchyPair entries.
   *
   * @param {string} modelId - The modelId of the model to which the new SkillHierarchyPair entries will belong.
   * @param {INewSkillHierarchyPairSpec[]} newSkillHierarchyPairSpecs - An array of specifications for the new SkillHierarchyPair entries.
   * @return {Promise<ISkillHierarchyPair[]>} - A Promise that resolves to an array containing the newly created ISkillHierarchyPair entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(modelId: string, newSkillHierarchyPairSpecs: INewSkillHierarchyPairSpec[]): Promise<ISkillHierarchyPair[]>;
}

export class SkillHierarchyRepository implements ISkillHierarchyRepository {
  public readonly hierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>;
  public readonly skillModel: mongoose.Model<ISkillDoc>;
  public readonly skillGroupModel: mongoose.Model<ISkillGroupDoc>;

  constructor(
    hierarchyModel: mongoose.Model<ISkillHierarchyPairDoc>,
    skillModel: mongoose.Model<ISkillDoc>,
    skillGroupModel: mongoose.Model<ISkillGroupDoc>
  ) {
    this.hierarchyModel = hierarchyModel;
    this.skillModel = skillModel;
    this.skillGroupModel = skillGroupModel;
  }

  async createMany(
    modelId: string,
    newSkillHierarchyPairSpecs: INewSkillHierarchyPairSpec[]
  ): Promise<ISkillHierarchyPair[]> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) throw new Error(`Invalid modelId: ${modelId}`);
    const existingIds = new Map<string, ObjectTypes>();
    try {
      // Get all SkillGroups
      const _existingSkillGroupIds = await this.skillGroupModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingSkillGroupIds.forEach((skillGroup) =>
        existingIds.set(skillGroup._id.toString(), ObjectTypes.SkillGroup)
      );

      // Get all Skills
      const _existingSkillsIds = await this.skillModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingSkillsIds.forEach((skill) => existingIds.set(skill._id.toString(), ObjectTypes.Skill));

      const newSkillHierarchyPairModels = newSkillHierarchyPairSpecs
        .filter((spec) => {
          return isHierarchyPairValid(spec, existingIds, [
            { parentType: ObjectTypes.SkillGroup, childType: ObjectTypes.SkillGroup },
            { parentType: ObjectTypes.SkillGroup, childType: ObjectTypes.Skill },
            { parentType: ObjectTypes.Skill, childType: ObjectTypes.Skill },
          ]);
        })
        .map((spec) => {
          try {
            return new this.hierarchyModel({
              ...spec,
              modelId: modelId,
              parentDocModel:
                spec.parentType === ObjectTypes.SkillGroup ? this.skillGroupModel.modelName : this.skillModel.modelName,
              childDocModel:
                spec.childType === ObjectTypes.SkillGroup ? this.skillGroupModel.modelName : this.skillModel.modelName,
            });
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);

      const newHierarchy = await this.hierarchyModel.insertMany(newSkillHierarchyPairModels, {
        ordered: false,
      });
      return newHierarchy.map((pair) => pair.toObject());
    } catch (e: unknown) {
      // If the error is a bulk write error, we can still return the created documents
      // Such an error will occur if a unique index is violated
      if ((e as { name?: string }).name === "MongoBulkWriteError") {
        console.warn("some hierarchy could not be created", e);
        const bulkWriteError = e as mongoose.mongo.MongoBulkWriteError;
        const newHierarchy: ISkillHierarchyPair[] = [];
        for await (const doc of bulkWriteError.insertedDocs) {
          newHierarchy.push(doc.toObject());
        }
        return newHierarchy;
      }
      console.error("batch create failed", e);
      throw e;
    }
  }
}
