import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import {
  IExtendedLocalizedOccupation,
  ILocalizedOccupation,
  ILocalizedOccupationDoc,
  INewLocalizedOccupationSpec,
} from "./localizedOccupation.types";

import { IOccupationDoc } from "esco/occupation/occupation.types";
import {
  populateOccupationParentOptions,
  populateOccupationChildrenOptions,
} from "esco/occupation/populateOccupationHierarchyOptions";
import {
  populateLocalizedOccupationRequiresSkillsOptions,
  populateLocalizedOccupationLocalizesOccupationOptions,
  occupationFromLocalizedOccupationTransform,
} from "./populateLocalizesOccupationOptions";

export interface ILocalizedOccupationRepository {
  readonly Model: mongoose.Model<ILocalizedOccupationDoc>;

  /**
   * Creates a new Localized Occupation entry.
   *
   * @param {INewLocalizedOccupationSpec} newLocalizedOccupationSpec - The specification for the new Localized Occupation entry.
   * @return {Promise<ILocalizedOccupation>} - A Promise that resolves to the newly created Localized Occupation entry.
   * Rejects with an error if the Localized Occupation entry cannot be created ue to reasons other than validation.
   */
  create(newLocalizedOccupationSpec: INewLocalizedOccupationSpec): Promise<IExtendedLocalizedOccupation>;

  /**
   * Creates multiple new LocalizedOccupation entries.
   *
   * @param {INewLocalizedOccupationSpec[]} newLocalizedOccupationSpecs - An array of specifications for the new Localized Occupation entries.
   * @return {Promise<ILocalizedOccupation[]>} - A Promise that resolves to an array containing the newly created Localized Occupation entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newLocalizedOccupationSpecs: INewLocalizedOccupationSpec[]): Promise<IExtendedLocalizedOccupation[]>;

  /**
   * Finds a Localized Occupation entry by its ID.
   *
   * @param {string} id - The unique ID of the Localized Occupation entry.
   * @return {Promise<ILocalizedOccupation|null>} - A Promise that resolves to the found Localized Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string): Promise<IExtendedLocalizedOccupation | null>;
}

export class LocalizedOccupationRepository implements ILocalizedOccupationRepository {
  public readonly Model: mongoose.Model<ILocalizedOccupationDoc>;
  public readonly OccupationModel = mongoose.Model<IOccupationDoc>;

  constructor(model: mongoose.Model<ILocalizedOccupationDoc>, occupationModel: mongoose.Model<IOccupationDoc>) {
    this.Model = model;
    this.OccupationModel = occupationModel;
  }

  async create(newLocalizedOccupationSpec: INewLocalizedOccupationSpec): Promise<IExtendedLocalizedOccupation> {
    //@ts-ignore
    if (newLocalizedOccupationSpec.UUID !== undefined) {
      const e = new Error("UUID should not be provided");
      console.error("create failed", e);
      throw e;
    }

    const localizingOccupation = await this.OccupationModel.findById(newLocalizedOccupationSpec.localizesOccupationId);

    if (!localizingOccupation) {
      const e = new Error("localizingOccupation not found");
      console.error("create failed", e);
      throw e;
    }

    try {
      const newLocalizedOccupationModel = new this.Model({
        ...newLocalizedOccupationSpec,
        UUID: randomUUID(),
      });

      await newLocalizedOccupationModel.save();
      // populating the parent, children, requiresSkills and localizesOccupation fields

      await newLocalizedOccupationModel.populate([
        populateOccupationParentOptions,
        populateOccupationChildrenOptions,
        populateLocalizedOccupationRequiresSkillsOptions,
        populateLocalizedOccupationLocalizesOccupationOptions,
      ]);

      return occupationFromLocalizedOccupationTransform(newLocalizedOccupationModel.toObject());
    } catch (e: unknown) {
      console.error("create failed", e);
      throw e;
    }
  }

  async createMany(
    newLocalizedOccupationSpecs: INewLocalizedOccupationSpec[]
  ): Promise<IExtendedLocalizedOccupation[]> {
    const localizingOccupationIds = await this.OccupationModel.find({});

    try {
      const newLocalizedOccupationModels = newLocalizedOccupationSpecs
        .filter((spec) =>
          localizingOccupationIds.find((occupation) => occupation._id.toString() === spec.localizesOccupationId)
        )
        .map((spec) => {
          try {
            return new this.Model({
              ...spec,
              UUID: randomUUID(), // override UUID silently
            });
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const newLocalizedOccupations = await this.Model.insertMany(newLocalizedOccupationModels, {
        ordered: false,
        populate: [
          populateOccupationParentOptions,
          populateOccupationChildrenOptions,
          populateLocalizedOccupationRequiresSkillsOptions,
          populateLocalizedOccupationLocalizesOccupationOptions,
        ],
      });

      return newLocalizedOccupations.map((LocalizedOccupation) =>
        occupationFromLocalizedOccupationTransform(LocalizedOccupation.toObject())
      );
    } catch (e: unknown) {
      const newLocalizedOccupations = await handleInsertManyError<ILocalizedOccupation>(
        e,
        "LocalizedOccupationRepository.createMany",
        newLocalizedOccupationSpecs.length,
        [
          populateOccupationParentOptions,
          populateOccupationChildrenOptions,
          populateLocalizedOccupationRequiresSkillsOptions,
          populateLocalizedOccupationLocalizesOccupationOptions,
        ]
      );
      return newLocalizedOccupations.map((localizedOccupation) =>
        occupationFromLocalizedOccupationTransform(localizedOccupation)
      );
    }
  }

  async findById(id: string | mongoose.Types.ObjectId): Promise<IExtendedLocalizedOccupation | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const localizedOccupation = await this.Model.findById(id).populate([
        populateOccupationParentOptions,
        populateOccupationChildrenOptions,
        populateLocalizedOccupationRequiresSkillsOptions,
        populateLocalizedOccupationLocalizesOccupationOptions,
      ]);
      return localizedOccupation !== null
        ? occupationFromLocalizedOccupationTransform(localizedOccupation.toObject())
        : null;
    } catch (e: unknown) {
      console.error("findById failed", e);
      throw e;
    }
  }
}
