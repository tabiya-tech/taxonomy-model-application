import mongoose from "mongoose";
import {ObjectTypes} from "esco/common/objectTypes";
import {IOccupationDoc} from "esco/occupation/occupation.types";
import {IISCOGroupDoc} from "esco/iscoGroup/ISCOGroup.types";
import {
  INewOccupationHierarchyPairSpec,
  IOccupationHierarchyPair,
  IOccupationHierarchyPairDoc
} from "./occupationHierarchy.types";

export interface IOccupationHierarchyRepository {
  hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>;

  createMany(modelId: string, newOccupationHierarchyPairSpecs: INewOccupationHierarchyPairSpec[]): Promise<IOccupationHierarchyPair[]>;
}

export class OccupationHierarchyRepository implements IOccupationHierarchyRepository {
  public readonly hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>;
  public readonly iscoGroupModel: mongoose.Model<IISCOGroupDoc>;
  public readonly occupationModel: mongoose.Model<IOccupationDoc>;

  constructor(hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>, iscoGroupModel: mongoose.Model<IISCOGroupDoc>, occupationModel: mongoose.Model<IOccupationDoc>) {
    this.hierarchyModel = hierarchyModel;
    this.iscoGroupModel = iscoGroupModel;
    this.occupationModel = occupationModel;
  }

  async createMany(modelId: string, newOccupationHierarchyPairSpecs: INewOccupationHierarchyPairSpec[]): Promise<IOccupationHierarchyPair[]> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) throw new Error(`Invalid modelId: ${modelId}`);
    const existingIds = new Map<string, ObjectTypes>();
    //  get all ISCO groups
    const _existingIscoGroupIds = await this.iscoGroupModel.find({modelId: {$eq: modelId}}).select("_id").exec();
    _existingIscoGroupIds.forEach((iscoGroup) => existingIds.set(iscoGroup._id.toString(), ObjectTypes.ISCOGroup));

    //  get all Occupations
    const _existingOccupationsIds = await this.occupationModel.find({modelId: {$eq: modelId}}).select("_id").exec();
    _existingOccupationsIds.forEach((occupation) => existingIds.set(occupation._id.toString(), ObjectTypes.Occupation));

    try {
      const newOccupationHierarchyPairModels = newOccupationHierarchyPairSpecs.filter((spec) => {
        if (spec.childId === spec.parentId) return false; // skip self referencing

        if (spec.parentType === ObjectTypes.Occupation && spec.childType === ObjectTypes.ISCOGroup) return false; // skip if parent is Occupation and child is ISCOGroup

        if (spec.parentType !== ObjectTypes.ISCOGroup && spec.parentType !== ObjectTypes.Occupation) return false; // skip if parentType is not ISCOGroup or Occupation

        if (spec.childType !== ObjectTypes.ISCOGroup && spec.childType !== ObjectTypes.Occupation) return false; // skip if childType is not ISCOGroup or Occupation

        const existingParentType = existingIds.get(spec.parentId.toString());
        if (!existingParentType) return false; // skip if parentId is not found in the existingIds
        if (spec.parentType !== existingParentType) return false; // skip if the parentType does not match the existingParentType

        const existingChildType = existingIds.get(spec.childId.toString());
        if (!existingChildType) return false; // skip if  is not found in the existingIds
        if (spec.childType !== existingChildType) return false; // skip if the parentType does not match the existingParentType
        return true;
      }).map((spec) => {
        try {
          return new this.hierarchyModel({
            ...spec,
            modelId: modelId,
            parentDocModel: spec.parentType === ObjectTypes.ISCOGroup ? this.iscoGroupModel.modelName : this.occupationModel.modelName,
            childDocModel: spec.childType === ObjectTypes.ISCOGroup ? this.iscoGroupModel.modelName : this.occupationModel.modelName,
          });
        } catch (e: unknown) {
          return null;
        }
      }).filter(Boolean);
      const newHierarchy = await this.hierarchyModel.insertMany(newOccupationHierarchyPairModels, {
        ordered: false,
      });
      return newHierarchy.map((pair) => pair.toObject());
    } catch (e: unknown) {
      // If the error is a bulk write error, we can still return the created documents
      // Such an error will occur if a unique index is violated
      if ((e as { name?: string }).name === "MongoBulkWriteError") {
        console.warn("some hierarchy could not be created", e);
        const bulkWriteError = e as mongoose.mongo.MongoBulkWriteError;
        const newHierarchy: IOccupationHierarchyPair[] = [];
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