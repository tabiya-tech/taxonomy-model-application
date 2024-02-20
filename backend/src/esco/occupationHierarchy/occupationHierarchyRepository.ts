import mongoose from "mongoose";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationDoc } from "esco/occupations/occupation/occupation.types";
import { IISCOGroupDoc } from "esco/iscoGroup/ISCOGroup.types";
import {
  INewOccupationHierarchyPairSpec,
  IOccupationHierarchyPair,
  IOccupationHierarchyPairDoc,
} from "./occupationHierarchy.types";

import { isNewOccupationHierarchyPairSpecValid } from "./occupationHierarchyValidation";
import { getModelName } from "esco/common/mongooseModelNames";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable } from "node:stream";
import stream from "stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";

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
    const newHierarchyDocs: mongoose.Document<unknown, unknown, IOccupationHierarchyPairDoc>[] = [];
    try {
      const existingIds = new Map<string, ObjectTypes[]>();

      //  get all ISCO groups
      const _existingIscoGroupIds = await this.iscoGroupModel
        .find({ modelId: { $eq: modelId } })
        .select("_id")
        .exec();
      _existingIscoGroupIds.forEach((iscoGroup) => existingIds.set(iscoGroup._id.toString(), [ObjectTypes.ISCOGroup]));

      //  get all Occupations
      const _existingOccupations = await this.occupationModel
        .find({ modelId: { $eq: modelId } })
        .select("_id occupationType")
        .exec();

      // beside the id, we also need to know the occupationType
      _existingOccupations.forEach((occupation) => {
        const found = existingIds.get(occupation._id.toString());
        if (found) {
          found.push(occupation.occupationType);
        } else {
          existingIds.set(occupation._id.toString(), [occupation.occupationType]);
        }
      });

      const newOccupationHierarchyPairModels = newOccupationHierarchyPairSpecs
        .filter((spec) => {
          return isNewOccupationHierarchyPairSpecValid(spec, existingIds);
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
