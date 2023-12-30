import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { ISkillDoc } from "esco/skill/skills.types";
import { INewSkillHierarchyPairSpec, ISkillHierarchyPair, ISkillHierarchyPairDoc } from "./skillHierarchy.types";
import { ISkillGroupDoc } from "esco/skillGroup/skillGroup.types";
import { isNewSkillHierarchyPairSpecValid } from "./skillHierarchyValidation";
import { getModelName } from "esco/common/mongooseModelNames";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import stream from "stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";

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

  /**
   * Returns all SkillHierarchyPair entries as a stream. The entries are transformed to objects (via the .toObject()).
   * @param {string} modelId - The modelId of the skills.
   * @return {Readable} - A Readable stream of ISkillHierarchyPair
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;
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
    const newHierarchyDocs: mongoose.Document<unknown, unknown, ISkillHierarchyPairDoc>[] = [];
    const existingIds = new Map<string, ObjectTypes[]>();
    try {
      // Get all SkillGroups
      const _existingSkillGroupIds = await this.skillGroupModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingSkillGroupIds.forEach((skillGroup) =>
        existingIds.set(skillGroup._id.toString(), [ObjectTypes.SkillGroup])
      );

      // Get all Skills
      const _existingSkillsIds = await this.skillModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingSkillsIds.forEach((skill) => {
        const found = existingIds.get(skill._id.toString());
        if (found) {
          found.push(ObjectTypes.Skill);
        } else {
          existingIds.set(skill._id.toString(), [ObjectTypes.Skill]);
        }
      });

      const newSkillHierarchyPairModels = newSkillHierarchyPairSpecs
        .filter((spec) => isNewSkillHierarchyPairSpecValid(spec, existingIds))
        .map((spec) => {
          try {
            return new this.hierarchyModel({
              ...spec,
              modelId: modelId,
              parentDocModel: getModelName(spec.parentType),
              childDocModel: getModelName(spec.childType),
            });
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);

      const docs = await this.hierarchyModel.insertMany(newSkillHierarchyPairModels, {
        ordered: false,
      });
      newHierarchyDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<ISkillHierarchyPairDoc>(
        e,
        "SkillHierarchyRepository.createMany",
        newSkillHierarchyPairSpecs.length
      );
      newHierarchyDocs.push(...docs);
    }

    if (newSkillHierarchyPairSpecs.length !== newHierarchyDocs.length) {
      console.warn(
        `SkillHierarchyRepository.createMany: ${
          newSkillHierarchyPairSpecs.length - newHierarchyDocs.length
        } invalid entries were not created`
      );
    }
    return newHierarchyDocs.map((pair) => pair.toObject());
  }

  findAll(modelId: string): Readable {
    try {
      return stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.hierarchyModel.find({ modelId: { $eq: modelId } }).cursor(),
        new DocumentToObjectTransformer<ISkillHierarchyPair>(),
        () => undefined
      );
    } catch (e: unknown) {
      console.error("findAll failed", e);
      throw e;
    }
  }
}
