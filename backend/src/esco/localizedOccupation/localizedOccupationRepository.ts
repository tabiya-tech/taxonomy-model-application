import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import {
  ILocalizedOccupation,
  ILocalizedOccupationDoc,
  INewLocalizedOccupationSpec,
} from "./localizedOccupation.types";

import { IOccupationDoc } from "esco/occupation/occupation.types";
import { Readable } from "node:stream";
import stream from "stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import { OccupationType } from "../common/objectTypes";

export interface ILocalizedOccupationRepository {
  readonly Model: mongoose.Model<ILocalizedOccupationDoc>;

  /**
   * Creates a new Localized Occupation entry.
   *
   * @param {INewLocalizedOccupationSpec} newLocalizedOccupationSpec - The specification for the new Localized Occupation entry.
   * @return {Promise<ILocalizedOccupation>} - A Promise that resolves to the newly created Localized Occupation entry.
   * Rejects with an error if the Localized Occupation entry cannot be created ue to reasons other than validation.
   */
  create(newLocalizedOccupationSpec: INewLocalizedOccupationSpec): Promise<ILocalizedOccupation>;

  /**
   * Creates multiple new LocalizedOccupation entries.
   *
   * @param modelId - The modelId of the Localized Occupation entries.
   * @param {INewLocalizedOccupationSpec[]} newLocalizedOccupationSpecs - An array of specifications for the new Localized Occupation entries.
   * @return {Promise<ILocalizedOccupation[]>} - A Promise that resolves to an array containing the newly created Localized Occupation entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(
    modelId: string,
    newLocalizedOccupationSpecs: INewLocalizedOccupationSpec[]
  ): Promise<ILocalizedOccupation[]>;

  /**
   * Finds a Localized Occupation entry by its ID.
   *
   * @param {string} id - The unique ID of the Localized Occupation entry.
   * @return {Promise<ILocalizedOccupation|null>} - A Promise that resolves to the found Localized Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<ILocalizedOccupation | null>;

  /**
   * Returns all Localized occupations as a stream. The Localized Occupations are transformed to objects (via the .toObject()), however
   * in the current version they are not populated with parent, children, required skills or localizesOccupation.This will be implemented in a future version.
   * @param {string} modelId - The modelId of the Localized occupations.
   * @return {Readable} - A Readable stream of ILocalizedOccupation
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string): Readable;
}

export class LocalizedOccupationRepository implements ILocalizedOccupationRepository {
  public readonly Model: mongoose.Model<ILocalizedOccupationDoc>;
  public readonly OccupationModel = mongoose.Model<IOccupationDoc>;

  constructor(model: mongoose.Model<ILocalizedOccupationDoc>, occupationModel: mongoose.Model<IOccupationDoc>) {
    this.Model = model;
    this.OccupationModel = occupationModel;
  }

  private newSpecToModel(newSpec: INewLocalizedOccupationSpec): mongoose.HydratedDocument<ILocalizedOccupationDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newLocalizedOccupationSpec: INewLocalizedOccupationSpec): Promise<ILocalizedOccupation> {
    //@ts-ignore
    if (newLocalizedOccupationSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    try {
      // We need to check if the occupation to be localized even exists
      const localizingOccupation = await this.OccupationModel.findById(
        newLocalizedOccupationSpec.localizesOccupationId
      );

      if (!localizingOccupation) {
        throw new Error("The Occupation to be localized was not found");
      }

      const newLocalizedOccupationModel = this.newSpecToModel(newLocalizedOccupationSpec);
      const newLocalizedOccupation = await newLocalizedOccupationModel.save();

      return newLocalizedOccupation.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(
    modelId: string,
    newLocalizedOccupationSpecs: INewLocalizedOccupationSpec[]
  ): Promise<ILocalizedOccupation[]> {
    const existingIds = new Map<string, string>();
    // find all the occupations in the given model to check that the localizedOccupationIds of entries in the specs correspond to an existing occupation
    // Also since only ESCO occupations can be localized, we filter only the entries with an OccupationType of ESCO
    const localizingOccupationIds = await this.OccupationModel.find({
      modelId: { $eq: modelId },
      occupationType: { $eq: OccupationType.ESCO },
    });

    // add each of the valid localizable ids to the existingIds map to search later
    localizingOccupationIds.forEach((occupation) => {
      existingIds.set(occupation._id.toString(), occupation.occupationType);
    });

    const newLocalizedOccupationsDocs: mongoose.Document<unknown, unknown, ILocalizedOccupationDoc>[] = [];
    try {
      const newLocalizedOccupationModels = newLocalizedOccupationSpecs
        .filter((spec) => existingIds.get(spec.localizesOccupationId))
        .map((spec) => {
          try {
            return this.newSpecToModel(spec);
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const docs = await this.Model.insertMany(newLocalizedOccupationModels, {
        ordered: false,
      });
      newLocalizedOccupationsDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<ILocalizedOccupationDoc>(
        e,
        "LocalizedOccupationRepository.createMany",
        newLocalizedOccupationSpecs.length
      );
      newLocalizedOccupationsDocs.push(...docs);
    }

    if (newLocalizedOccupationSpecs.length !== newLocalizedOccupationsDocs.length) {
      console.warn(
        `LocalizedOccupationRepository.createMany: ${
          newLocalizedOccupationSpecs.length - newLocalizedOccupationsDocs.length
        } invalid entries were not created`
      );
    }
    return newLocalizedOccupationsDocs.map((doc) => doc.toObject());
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<ILocalizedOccupation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const localizedOccupation = await this.Model.findById(id);
      return localizedOccupation !== null ? localizedOccupation.toObject() : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      throw e;
    }
  }

  findAll(modelId: string): Readable {
    try {
      return stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({ modelId: { $eq: modelId } }).cursor(),
        // in the current version we do not populate the parent, children, requiresSkills or localizesOccupation
        new DocumentToObjectTransformer<ILocalizedOccupation>(),
        () => undefined
      );
    } catch (e: unknown) {
      console.error("findAll failed", e);
      throw e;
    }
  }
}
