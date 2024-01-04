import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { INewOccupationSpec, IOccupation, IOccupationDoc } from "./occupation.types";
import {
  populateOccupationChildrenOptions,
  populateOccupationParentOptions,
} from "./populateOccupationHierarchyOptions";
import { populateOccupationRequiresSkillsOptions } from "./populateOccupationToSkillRelationOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { OccupationType } from "esco/common/objectTypes";
import { Readable } from "node:stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import stream from "stream";
import { populateEmptyOccupationHierarchy } from "esco/occupationHierarchy/populateFunctions";
import { populateEmptyRequiresSkills } from "esco/occupationToSkillRelation/populateFunctions";
import {populateOccupationLocalizedOptions} from "./populateLocalizedOccupationOptions";
import {populateEmptyLocalizedOccupation} from "../localizedOccupation/populateFunctions";

export interface IOccupationRepository {
  readonly Model: mongoose.Model<IOccupationDoc>;

  /**
   * Creates a new Occupation entry.
   *
   * @param {INewOccupationSpec} newOccupationSpec - The specification for the new Occupation entry.
   * @return {Promise<IOccupation>} - A Promise that resolves to the newly created Occupation entry.
   * Rejects with an error if the Occupation entry cannot be created ue to reasons other than validation.
   */
  create(newOccupationSpec: INewOccupationSpec): Promise<IOccupation>;

  /**
   * Creates multiple new Occupation entries.
   *
   * @param {INewOccupationSpec[]} newOccupationSpecs - An array of specifications for the new Occupation entries.
   * @return {Promise<IOccupation[]>} - A Promise that resolves to an array containing the newly created Occupation entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]>;

  /**
   * Finds an Occupation entry by its ID.
   *
   * @param {string} id - The unique ID of the Occupation entry.
   * @return {Promise<IOccupation|null>} - A Promise that resolves to the found Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<IOccupation | null>;

  /**
   * Returns all occupations as a stream. The Occupations are transformed to objects (via the .toObject()), however
   * in the current version they are not populated with parents, children or required skills.This will be implemented in a future version.
   * @param {string} modelId - The modelId of the occupations.
   * @param {OccupationType} occupationType - Used for filtering between local and ESCO occupations.
   * @return {Readable} - A Readable stream of IOccupations
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string, occupationType: OccupationType): Readable;
}

export class OccupationRepository implements IOccupationRepository {
  public readonly Model: mongoose.Model<IOccupationDoc>;

  constructor(model: mongoose.Model<IOccupationDoc>) {
    this.Model = model;
  }

  private newSpecToModel(newSpec: INewOccupationSpec): mongoose.HydratedDocument<IOccupationDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...newSpec,
      UUID: newUUID,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newOccupationSpec: INewOccupationSpec): Promise<IOccupation> {
    //@ts-ignore
    if (newOccupationSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    try {
      const newOccupationModel = this.newSpecToModel(newOccupationSpec);
      await newOccupationModel.save();
      populateEmptyOccupationHierarchy(newOccupationModel);
      populateEmptyRequiresSkills(newOccupationModel);
      populateEmptyLocalizedOccupation(newOccupationModel);
      return newOccupationModel.toObject();
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]> {
    const newOccupationsDocs: mongoose.Document<unknown, unknown, IOccupationDoc>[] = [];
    try {
      const newOccupationModels = newOccupationSpecs
        .map((spec) => {
          try {
            return this.newSpecToModel(spec);
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const docs = await this.Model.insertMany(newOccupationModels, {
        ordered: false,
      });
      newOccupationsDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<IOccupationDoc>(
        e,
        "OccupationRepository.createMany",
        newOccupationSpecs.length
      );
      newOccupationsDocs.push(...docs);
    }
    if (newOccupationSpecs.length !== newOccupationsDocs.length) {
      console.warn(
        `OccupationRepository.createMany: ${
          newOccupationSpecs.length - newOccupationsDocs.length
        } invalid entries were not created`
      );
    }
    return newOccupationsDocs.map((doc) => {
      populateEmptyOccupationHierarchy(doc);
      populateEmptyRequiresSkills(doc);
      populateEmptyLocalizedOccupation(doc);
      return doc.toObject();
    });
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<IOccupation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const occupation = await this.Model.findById(id)
        .populate(populateOccupationParentOptions)
        .populate(populateOccupationChildrenOptions)
        .populate(populateOccupationRequiresSkillsOptions)
        .populate(populateOccupationLocalizedOptions)
        .exec();
      return occupation !== null ? occupation.toObject() : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      throw e;
    }
  }

  findAll(modelId: string, occupationType: OccupationType): Readable {
    // Allow only ESCO or local occupations
    if (occupationType !== OccupationType.ESCO && occupationType !== OccupationType.LOCAL) {
      const e = new Error("OccupationType must be either ESCO or LOCAL");
      console.error("findAll failed", e);
      throw e;
    }
    try {
      return stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({
          modelId: { $eq: modelId },
          occupationType: { $eq: occupationType },
        }).cursor(),
        // in the current version we do not populate the parent, children or requiresSkills
        new DocumentToObjectTransformer<IOccupation>(),
        () => undefined
      );
    } catch (e: unknown) {
      console.error("findAll failed", e);
      throw e;
    }
  }
}
