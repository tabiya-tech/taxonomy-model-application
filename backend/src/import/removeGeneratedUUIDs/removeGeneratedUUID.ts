import mongoose from "mongoose";
import { IOccupationDoc } from "esco/occupations/occupation.types";
import { ISkillDoc } from "esco/skill/skills.types";
import { ISkillGroupDoc } from "esco/skillGroup/skillGroup.types";
import { IISCOGroupDoc } from "esco/iscoGroup/ISCOGroup.types";
import { IModelInfoDoc } from "modelInfo/modelInfo.types";

export interface ICleanupUUIDHistory {
  /**
   * Cleans up the UUID history for a model, removing the fisrt UUID from the history.
   * This is used when importing a model that already has a UUID assigned to it, outside of the import process.
   * An example of this happening is when an original ESCO model is imported, and the UUIDs are preserved.
   * @param modelId
   */
  removeUUIDFromHistory(modelId: string): Promise<void>;
}

export class RemoveGeneratedUUID implements ICleanupUUIDHistory {
  private readonly OccupationModel = mongoose.Model<IOccupationDoc>;
  private readonly SkillModel: mongoose.Model<ISkillDoc>;
  private readonly SkillGroupModel: mongoose.Model<ISkillGroupDoc>;
  private readonly ISCOGroupModel: mongoose.Model<IISCOGroupDoc>;
  private readonly ModelInfoModel: mongoose.Model<IModelInfoDoc>;

  constructor(
    occupationModel: mongoose.Model<IOccupationDoc>,
    skillModel: mongoose.Model<ISkillDoc>,
    skillGroupModel: mongoose.Model<ISkillGroupDoc>,
    iscoGroupModel: mongoose.Model<IISCOGroupDoc>,
    modelInfoModel: mongoose.Model<IModelInfoDoc>
  ) {
    this.OccupationModel = occupationModel;
    this.SkillModel = skillModel;
    this.SkillGroupModel = skillGroupModel;
    this.ISCOGroupModel = iscoGroupModel;
    this.ModelInfoModel = modelInfoModel;
  }

  async removeUUIDFromHistory(modelId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      throw new Error("Invalid modelId");
    }

    try {
      // first find the model
      const model = await this.ModelInfoModel.findById(new mongoose.Types.ObjectId(modelId)).exec();
      if (!model) {
        throw new Error("Model not found");
      }
      // Remove the first UUID from the history for the model
      model.UUIDHistory.shift();

      const updateOperation = { $pop: { UUIDHistory: -1 } };
      const entityFilter = { modelId: { $eq: modelId } };
      // Perform bulk updates for each entity in parallel
      await Promise.all([
        model.save(), // Save the model with the updated UUID history
        this.OccupationModel.updateMany(entityFilter, updateOperation).exec(),
        this.SkillModel.updateMany(entityFilter, updateOperation).exec(),
        this.SkillGroupModel.updateMany(entityFilter, updateOperation).exec(),
        this.ISCOGroupModel.updateMany(entityFilter, updateOperation).exec(),
      ]);
    } catch (error) {
      console.error(new Error("Error occurred during cleanup:", { cause: error }));
      throw error;
    }
  }
}
