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
      // First find the model
      const model = await this.ModelInfoModel.findById(new mongoose.Types.ObjectId(modelId)).exec();
      if (!model) {
        throw new Error("Model not found");
      }
      // Remove the first UUID from the history for the model and update the UUID field
      model.UUIDHistory.shift();
      model.UUID = model.UUIDHistory[0];

      const entityFilter = { modelId: { $eq: modelId } };
      const updatePipeline = [
        {
          $set: {
            UUIDHistory: { $slice: ["$UUIDHistory", 1, {$size: "$UUIDHistory"}] }, // Removes the first element
            UUID: { $arrayElemAt: ["$UUIDHistory", 1] }, // Sets UUID to the first element of the updated UUIDHistory
          }
        }
      ];

      // Perform bulk updates for each entity in parallel, including the model save operation
      await Promise.all([
        model.save(), // Save the model with the updated UUID history and UUID field
        this.OccupationModel.updateMany(entityFilter, updatePipeline).exec(),
        this.SkillModel.updateMany(entityFilter, updatePipeline).exec(),
        this.SkillGroupModel.updateMany(entityFilter, updatePipeline).exec(),
        this.ISCOGroupModel.updateMany(entityFilter, updatePipeline).exec(),
      ]);
    } catch (error) {
      console.error(new Error("Error occurred during cleanup:", { cause: error }));
      throw error;
    }
  }
}