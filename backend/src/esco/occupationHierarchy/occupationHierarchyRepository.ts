import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationDoc } from "esco/occupations/occupation.types";
import { IOccupationGroupDoc } from "esco/occupationGroup/OccupationGroup.types";
import {
  INewOccupationHierarchyPairSpec,
  IOccupationHierarchyPair,
  IOccupationHierarchyPairDoc,
} from "./occupationHierarchy.types";

import { isNewOccupationHierarchyPairSpecValid, isParentChildCodeConsistent } from "./occupationHierarchyValidation";
import { getModelName } from "esco/common/mongooseModelNames";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import stream from "stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import { OccupationGroupModelPaths } from "esco/occupationGroup/OccupationGroupModel";
import { OccupationModelPaths } from "esco/occupations/occupationModel";

export interface IOccupationHierarchyRepository {
  readonly hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>;
  readonly occupationGroupModel: mongoose.Model<IOccupationGroupDoc>;
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

  /**
   * Returns all OccupationHierarchyPair entries as a stream. The entries are transformed to objects (via the .toObject()).
   * @param {string} modelId - The modelId of the occupations.
   * @return {Readable} - A Readable stream of IOccupationHierarchyPair
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;
}

export class OccupationHierarchyRepository implements IOccupationHierarchyRepository {
  public readonly hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>;
  public readonly occupationGroupModel: mongoose.Model<IOccupationGroupDoc>;
  public readonly occupationModel: mongoose.Model<IOccupationDoc>;

  constructor(
    hierarchyModel: mongoose.Model<IOccupationHierarchyPairDoc>,
    occupationGroupModel: mongoose.Model<IOccupationGroupDoc>,
    occupationModel: mongoose.Model<IOccupationDoc>
  ) {
    this.hierarchyModel = hierarchyModel;
    this.occupationGroupModel = occupationGroupModel;
    this.occupationModel = occupationModel;
  }

  async createMany(
    modelId: string,
    newOccupationHierarchyPairSpecs: INewOccupationHierarchyPairSpec[]
  ): Promise<IOccupationHierarchyPair[]> {
    if (!mongoose.Types.ObjectId.isValid(modelId)) throw new Error(`Invalid modelId: ${modelId}`);
    const newHierarchyDocs: mongoose.Document<unknown, unknown, IOccupationHierarchyPairDoc>[] = [];
    try {
      const existingIds = new Map<string, ObjectTypes[]>();
      // The idToCode map was added after the existing ids as a separate map to avoid changing
      // the isNewOccupationHierarchyPairSpecValid function
      const idToCode = new Map<string, { type: ObjectTypes; code: string }[]>();

      //  get all Occupation groups
      const _existingOccupationGroupIds = await this.occupationGroupModel
        .find({ modelId: { $eq: modelId } })
        .select(`_id ${OccupationGroupModelPaths.groupType} ${OccupationGroupModelPaths.code}`)
        .exec();
      _existingOccupationGroupIds.forEach((occupationGroup) => {
        existingIds.set(occupationGroup._id.toString(), [occupationGroup.groupType]);
        idToCode.set(occupationGroup._id.toString(), [{ type: occupationGroup.groupType, code: occupationGroup.code }]);
      });

      //  get all Occupations
      const _existingOccupations = await this.occupationModel
        .find({ modelId: { $eq: modelId } })
        .select(`_id ${OccupationModelPaths.occupationType} ${OccupationModelPaths.code}`)
        .exec();

      // beside the id, we also need to know the occupationType and the code
      _existingOccupations.forEach((occupation) => {
        const foundOccupationGroupIds = existingIds.get(occupation._id.toString());
        const foundCodes = idToCode.get(occupation._id.toString());
        if (foundOccupationGroupIds) {
          foundOccupationGroupIds.push(occupation.occupationType);
        }
        if (foundCodes) {
          foundCodes.push({ type: occupation.occupationType, code: occupation.code });
          return;
        }

        existingIds.set(occupation._id.toString(), [occupation.occupationType]);
        idToCode.set(occupation._id.toString(), [{ type: occupation.occupationType, code: occupation.code }]);
      });

      const newOccupationHierarchyPairModels = newOccupationHierarchyPairSpecs
        .filter((spec) => {
          const validType = isNewOccupationHierarchyPairSpecValid(spec, existingIds);
          if (!validType) {
            console.warn("OccupationHierarchyRepository.createMany: invalid entry", spec);
            return false;
          }
          const validCode = isParentChildCodeConsistent(
            spec.parentType,
            spec.parentId,
            spec.childType,
            spec.childId,
            idToCode
          );
          if (!validCode) {
            console.warn("OccupationHierarchyRepository.createMany: invalid entry", spec);
          }
          return validType && validCode;
        })
        .map((spec) => {
          try {
            return new this.hierarchyModel({
              ...spec,
              modelId: modelId,
              parentDocModel: getModelName(spec.parentType),
              childDocModel: getModelName(spec.childType),
            });
          } catch (e: unknown) {
            console.warn("OccupationHierarchyRepository.createMany: invalid entry", spec, e);
            return null;
          }
        })
        .filter(Boolean);

      const docs = await this.hierarchyModel.insertMany(newOccupationHierarchyPairModels, {
        ordered: false,
      });
      newHierarchyDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<IOccupationHierarchyPairDoc>(
        e,
        "OccupationHierarchyRepository.createMany",
        newOccupationHierarchyPairSpecs.length
      );
      newHierarchyDocs.push(...docs);
    }

    if (newOccupationHierarchyPairSpecs.length !== newHierarchyDocs.length) {
      console.warn(
        `OccupationHierarchyRepository.createMany: ${
          newOccupationHierarchyPairSpecs.length - newHierarchyDocs.length
        } invalid entries were not created`
      );
    }
    return newHierarchyDocs.map((pair) => pair.toObject());
  }

  findAll(modelId: string): Readable {
    try {
      const pipeline = stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.hierarchyModel.find({ modelId: { $eq: modelId } }).cursor(),
        new DocumentToObjectTransformer<IOccupationHierarchyPair>(),
        () => undefined
      );
      pipeline.on("error", (e) => {
        console.error(new Error("OccupationHierarchyRepository.findAll: stream failed", { cause: e }));
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("OccupationHierarchyRepository.findAll: findAll failed", { cause: e });
      console.error(err);
      throw err;
    }
  }
}
