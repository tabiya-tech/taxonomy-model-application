import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationDoc } from "esco/occupation/occupation.types";
import { IISCOGroupDoc } from "esco/iscoGroup/ISCOGroup.types";
import {
  INewOccupationHierarchyPairSpec,
  IOccupationHierarchyPair,
  IOccupationHierarchyPairDoc,
} from "./occupationHierarchy.types";

import { isNewOccupationHierarchyPairSpecValid } from "./occupationHierarchyValidation";
import { getModelName } from "esco/common/mongooseModelNames";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";

export interface IOccupationHierarchyRepository {
  readonly hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>;
  readonly iscoGroupModel: mongoose.Model<IISCOGroupDoc>;
  readonly occupationModel: mongoose.Model<IOccupationDoc>;

  /**
   * Creates multiple new OccupationHierarchyPair entries.
   *
   * @param {string} modelId - The modelId of the model to which the new OccupationHierarchyPair entries will belong.
   * @param {INewOccupationHierarchyPairSpec[]} newOccupationHierarchyPairSpecs - An array of specifications for the new OccupationHierarchyPair entries.
   * @return {Promise<IOccupationHierarchyPair[]>} - A Promise that resolves to an array containing the newly created IOccupationHierarchyPair entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(
    modelId: string,
    newOccupationHierarchyPairSpecs: INewOccupationHierarchyPairSpec[]
  ): Promise<IOccupationHierarchyPair[]>;
}

export class OccupationHierarchyRepository implements IOccupationHierarchyRepository {
  public readonly hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>;
  public readonly iscoGroupModel: mongoose.Model<IISCOGroupDoc>;
  public readonly occupationModel: mongoose.Model<IOccupationDoc>;

  constructor(
    hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>,
    iscoGroupModel: mongoose.Model<IISCOGroupDoc>,
    occupationModel: mongoose.Model<IOccupationDoc>
  ) {
    this.hierarchyModel = hierarchyModel;
    this.iscoGroupModel = iscoGroupModel;
    this.occupationModel = occupationModel;
  }

  async createMany(
    modelId: string,
    newOccupationHierarchyPairSpecs: INewOccupationHierarchyPairSpec[]
  ): Promise<IOccupationHierarchyPair[]> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) throw new Error(`Invalid modelId: ${modelId}`);
    try {
      const existingIds = new Map<string, ObjectTypes>();

      //  get all ISCO groups
      const _existingIscoGroupIds = await this.iscoGroupModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingIscoGroupIds.forEach((iscoGroup) => existingIds.set(iscoGroup._id.toString(), ObjectTypes.ISCOGroup));

      //  get all Occupations
      const _existingOccupationsIds = await this.occupationModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingOccupationsIds.forEach((occupation) =>
        existingIds.set(occupation._id.toString(), ObjectTypes.Occupation)
      );

      const newOccupationHierarchyPairModels = newOccupationHierarchyPairSpecs
        .filter((spec) => isNewOccupationHierarchyPairSpecValid(spec, existingIds))
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

      const newHierarchy = await this.hierarchyModel.insertMany(newOccupationHierarchyPairModels, {
        ordered: false,
      });
      return newHierarchy.map((pair) => pair.toObject());
    } catch (e: unknown) {
      return handleInsertManyError<IOccupationHierarchyPair>(
        e,
        "OccupationHierarchyRepository.createMany",
        newOccupationHierarchyPairSpecs.length
      );
    }
  }
}
