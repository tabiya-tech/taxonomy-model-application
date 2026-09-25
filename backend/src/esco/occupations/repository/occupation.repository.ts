import mongoose, { PipelineStage } from "mongoose";
import { randomUUID } from "crypto";
import {
  INewOccupationSpec,
  INewOccupationSpecLocalized,
  INewOccupationSpecWithoutImportId,
  IOccupation,
  IOccupationDoc,
  IPartialUpdateOccupationSpec,
  ISkillWithRelation,
  IUpdateOccupationSpec,
  OCCUPATION_TRANSLATABLE_STRING_FIELDS,
} from "esco/occupations/_shared/occupation.types";
import { IOccupationGroup } from "esco/occupationGroup/_shared/OccupationGroup.types";
import {
  makePopulateOccupationChildrenOptions,
  makePopulateOccupationParentOptions,
  populateOccupationChildrenOptions,
  populateOccupationParentOptions,
} from "esco/occupations/_shared/populate/occupationHierarchyOptions";
import {
  makePopulateOccupationRequiresSkillsOptions,
  populateOccupationRequiresSkillsOptions,
} from "esco/occupations/_shared/populate/occupationToSkillRelationOptions";
import { handleInsertManyError } from "esco/common/handleInsertManyErrors";
import { Readable, Transform } from "node:stream";
import stream from "stream";
import { DocumentToObjectTransformer } from "esco/common/documentToObjectTransformer";
import { populateEmptyOccupationHierarchy } from "esco/occupationHierarchy/populateFunctions";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import {
  populateEmptyRequiredByOccupations,
  populateEmptyRequiresSkills,
} from "esco/occupationToSkillRelation/populateFunctions";
import { populateEmptySkillHierarchy } from "esco/skillHierarchy/populateFunctions";
import { populateEmptySkillToSkillRelation } from "esco/skillToSkillRelation/populateFunctions";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationReference } from "esco/occupations/_shared/occupationReference.types";
import {
  getOccupationDocReference,
  OccupationDocument,
  unwrapOccupationTranslatableFields,
} from "esco/occupations/_shared/occupation.reference";
import {
  IEmbeddableEntityRepository,
  ISetEntityEmbeddingStatusSpec,
  ISetModelEntitiesEmbeddingStatusSpec,
} from "embeddings/entityEmbeddings/entityEmbedding.types";
import {
  setEntityEmbeddingStatus,
  setModelEntitiesEmbeddingStatus,
} from "embeddings/entityEmbeddings/entityEmbeddingStatus";
import { wrapTranslatableFields } from "common/language/translatedFields";
import { buildSearchCondition } from "esco/common/searchCondition";
import { unwrapSkillTranslatableFieldsForLanguage } from "esco/skill/_shared/skillReference";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";
import { unwrapOccupationGroupTranslatableFields } from "esco/occupationGroup/_shared/OccupationGroupReference";

// same as OCCUPATION_TRANSLATABLE_STRING_FIELDS, plus altLabels (an array of localized sub documents)
const TRANSLATABLE_FIELDS = [...OCCUPATION_TRANSLATABLE_STRING_FIELDS, "altLabels"] as const;

/**
 * A single UUID from an entity's UUIDHistory resolved to the entity's reference (as it was in that model) and
 * the modelId of the model it belonged to. Both are null when no entity with that UUID exists. Order-preserving
 * against the input UUIDs.
 */
export interface IOccupationModelHistoryReference {
  UUID: string;
  modelId: string | null;
  reference: IOccupationReference | null;
}

export type SearchFilter = {
  occupationType?: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation;
};

export interface IOccupationRepository extends IEmbeddableEntityRepository {
  readonly Model: mongoose.Model<IOccupationDoc>;

  /**
   * Creates a new Occupation entry.
   *
   * @param {INewOccupationSpecWithoutImportId} newOccupationSpec - The specification for the new Occupation entry.
   * @return {Promise<IOccupation>} - A Promise that resolves to the newly created Occupation entry.
   * Rejects with an error if the Occupation entry cannot be created ue to reasons other than validation.
   */
  create(newOccupationSpec: INewOccupationSpecWithoutImportId): Promise<IOccupation>;

  /**
   * Creates multiple new Occupation entries.
   *
   * @param {INewOccupationSpec[]} newOccupationSpecs - An array of specifications for the new Occupation entries.
   * @return {Promise<IOccupation[]>} - A Promise that resolves to an array containing the newly created Occupation entries.
   * Excludes entries that fail validation and returns a subset of successfully created entries.
   * Rejects with an error if any entry cannot be created due to reasons other than validation.
   */
  createMany(newOccupationSpecs: INewOccupationSpec[]): Promise<IOccupation[]>;
  createManyLocalized(newOccupationSpecs: INewOccupationSpecLocalized[]): Promise<IOccupation[]>;

  /**
   * Finds an Occupation entry by its ID.
   *
   * @param {string} id - The unique ID of the Occupation entry.
   * @param {string} [language] - The language dbKeyName to resolve translatable fields to. Defaults to fallback.
   * @return {Promise<IOccupation|null>} - A Promise that resolves to the found Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  findById(id: string, language?: string): Promise<IOccupation | null>;

  /**
   * Returns all occupations as a stream. The Occupations are transformed to objects (via the .toObject()), however
   * in the current version they are not populated with parents, children or required skills.This will be implemented in a future version.
   * @param {string} modelId - The modelId of the occupations.
   * @param {SearchFilter} filter - Used for restricting the search.
   * @return {Readable} - A Readable stream of IOccupations
   * Rejects with an error if the operation fails.
   */
  findAll(modelId: string, filter?: SearchFilter): Readable;

  /**
   * Returns paginated Occupations, ordered by _id. When a `search` is provided, only Occupations whose
   * requested fields match the search value (case-insensitive regex) are returned; otherwise all the model's
   * Occupations are listed.
   * @param {string} modelId - The modelId of the Occupations.
   * @param {number} limit - The maximum number of Occupations to return.
   * @param {1 | -1} sortOrder - The sort order for pagination.
   * @param {string} [cursorId] - The ID of the cursor for pagination.
   * @param {Record<string, unknown>} [filter] - Additional filters to apply.
   * @param {{ value: string; fields: string[] }} [search] - The search value and the fields to match it on; when omitted the Occupations are not filtered.
   * @param {string} [language] - The language dbKeyName to resolve translatable fields to. Defaults to fallback.
   * @return {Promise<IOccupation[]>} - An array of IOccupations
   * Rejects with an error if the operation fails.
   */
  findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>,
    search?: { value: string; fields: string[] },
    language?: string
  ): Promise<IOccupation[]>;

  /**
   * Finds the Occupations of a model with the given ids, with parents, children and requiresSkills populated.
   * The result is NOT ordered by the input ids (the caller re-orders it). Ids that are not valid or do not belong
   * to the model are ignored. Used to hydrate the results of a vector search.
   *
   * @param {string} modelId - The modelId of the Occupations.
   * @param {string[]} ids - The ids of the Occupations to fetch.
   * @param {string} [language] - The language dbKeyName to resolve translatable fields to. Defaults to fallback.
   * @return {Promise<IOccupation[]>} - A Promise that resolves to the found Occupations.
   * Rejects with an error if the operation fails.
   */
  findByIds(modelId: string, ids: string[], language?: string): Promise<IOccupation[]>;

  /**
   * Finds an Occupation entry by it's UUID.
   *
   * @param {string} uuid - The unique UUID of the Occupation entry to find.
   * @param {string} [language] - The language dbKeyName to resolve translatable fields to. Defaults to fallback.
   * @return {Promise<IOccupation|null>} - A Promise that resolves to the found Occupation entry or null if not found.
   * Rejects with an error if the operation fails.
   */
  getOccupationByUUID(uuid: string, language?: string): Promise<IOccupation | null>;

  /**
   * Resolves each of the provided occupation UUIDs (an occupation's own UUIDHistory) to the occupation's
   * reference (as it appeared in that model) and the modelId of the model it belonged to.
   * The result is order-preserving against the input UUIDs; entries whose UUID matches no occupation carry
   * null modelId and null reference.
   *
   * @param {string[]} uuids - The occupation UUIDs to resolve.
   * @param {string} [language] - The language dbKeyName to resolve translatable fields to. Defaults to fallback.
   * @return {Promise<IOccupationModelHistoryReference[]>} - The resolved reference + modelId per input UUID.
   */
  findHistoryReferencesByUUIDs(uuids: string[], language?: string): Promise<IOccupationModelHistoryReference[]>;

  /**
   * Finds the parent Occupation of an Occupation.
   *
   * @param {string} modelId - The modelId of the Occupation.
   * @param {string} occupationId - The ID of the Occupation.
   * @param {string} [language] - The language dbKeyName to resolve translatable fields to. Defaults to fallback.
   * @return {Promise<IOccupation | IOccupationGroup | null>} - A Promise that resolves to the parent Occupation or null if not found.
   */
  findParent(modelId: string, occupationId: string, language?: string): Promise<IOccupation | IOccupationGroup | null>;

  /**
   * Finds the child Occupations of an Occupation.
   *
   * @param {string} modelId - The modelId of the Occupation.
   * @param {string} occupationId - The ID of the Occupation.
   * @param {number} limit - The maximum number of children to return.
   * @param {string} [cursor] - The ID of the cursor for pagination.
   * @param {string} [language] - The language dbKeyName to resolve translatable fields to. Defaults to fallback.
   * @return {Promise<IOccupation[]>} - A Promise that resolves to an array containing the child Occupations.
   */
  findChildren(
    modelId: string,
    occupationId: string,
    limit: number,
    cursor?: string,
    language?: string
  ): Promise<IOccupation[]>;

  /**
   * Finds the skills required by an Occupation, with relationship metadata.
   *
   * @param {string} modelId - The modelId of the Occupation.
   * @param {string} occupationId - The ID of the Occupation.
   * @param {number} limit - The maximum number of skills to return.
   * @param {string} [cursor] - The ID of the cursor for pagination.
   * @param {string} [language] - The language dbKeyName to resolve translatable fields to. Defaults to fallback.
   * @return {Promise<ISkillWithRelation[]>} - A Promise that resolves to an array of skills with relationship metadata.
   */
  findSkillsForOccupation(
    modelId: string,
    occupationId: string,
    limit: number,
    cursor?: string,
    language?: string
  ): Promise<ISkillWithRelation[]>;

  /**
   * Fully replaces the mutable fields of an Occupation (PUT semantics).
   *
   * @param {string} id - The ID of the Occupation to update.
   * @param {string} modelId - The model ID the Occupation belongs to.
   * @param {IUpdateOccupationSpec} spec - The full set of new field values.
   * @return {Promise<IOccupation | null>} - The updated occupation, or null if not found.
   * Rejects with an error if the operation fails.
   */
  update(id: string, modelId: string, spec: IUpdateOccupationSpec): Promise<IOccupation | null>;

  /**
   * Partially updates an Occupation (PATCH semantics).
   *
   * @param {string} id - The ID of the Occupation to update.
   * @param {string} modelId - The model ID the Occupation belongs to.
   * @param {IPartialUpdateOccupationSpec} spec - Only the fields to update.
   * @return {Promise<IOccupation | null>} - The updated occupation, or null if not found.
   * Rejects with an error if the operation fails.
   */
  patch(id: string, modelId: string, spec: IPartialUpdateOccupationSpec): Promise<IOccupation | null>;
}

export class OccupationRepository implements IOccupationRepository {
  public readonly Model: mongoose.Model<IOccupationDoc>;

  constructor(model: mongoose.Model<IOccupationDoc>) {
    this.Model = model;
  }

  private resolveLang(language?: string): string {
    return language ?? getFallbackLanguageConfig().dbKeyName;
  }

  async setEntityEmbeddingStatus(spec: ISetEntityEmbeddingStatusSpec): Promise<void> {
    return setEntityEmbeddingStatus(this.Model, spec);
  }

  async setModelEntitiesEmbeddingStatus(spec: ISetModelEntitiesEmbeddingStatusSpec): Promise<void> {
    return setModelEntitiesEmbeddingStatus(this.Model, spec);
  }

  private newSpecToModel(newSpec: INewOccupationSpec): mongoose.HydratedDocument<IOccupationDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...wrapTranslatableFields(newSpec, OCCUPATION_TRANSLATABLE_STRING_FIELDS),
      UUID: newUUID,
    });
    // add the new UUID as the first element of the UUIDHistory
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  private newSpecWithoutImportIdToModel(
    newSpec: INewOccupationSpecWithoutImportId
  ): mongoose.HydratedDocument<IOccupationDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({
      ...wrapTranslatableFields(newSpec, OCCUPATION_TRANSLATABLE_STRING_FIELDS),
      UUID: newUUID,
      importId: null,
    });
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async create(newOccupationSpec: INewOccupationSpecWithoutImportId): Promise<IOccupation> {
    //@ts-ignore
    if (newOccupationSpec.UUID !== undefined) {
      const err = new Error("OccupationRepository.create: create failed. UUID should not be provided.");
      throw err;
    }

    const fallbackLang = getFallbackLanguageConfig().dbKeyName;
    try {
      const newOccupationModel = this.newSpecWithoutImportIdToModel(newOccupationSpec);
      await newOccupationModel.save();
      populateEmptyOccupationHierarchy(newOccupationModel);
      populateEmptyRequiresSkills(newOccupationModel);
      return unwrapOccupationTranslatableFields(newOccupationModel.toObject() as unknown as IOccupation, fallbackLang);
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.create: create failed.", { cause: e });
      throw err;
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

    const fallbackLang = getFallbackLanguageConfig().dbKeyName;
    return newOccupationsDocs.map((doc) => {
      populateEmptyOccupationHierarchy(doc);
      populateEmptyRequiresSkills(doc);
      return unwrapOccupationTranslatableFields(doc.toObject() as unknown as IOccupation, fallbackLang);
    });
  }

  private newLocalizedSpecToModel(spec: INewOccupationSpecLocalized): mongoose.HydratedDocument<IOccupationDoc> {
    const newUUID = randomUUID();
    const newModel = new this.Model({ ...spec, UUID: newUUID });
    newModel.UUIDHistory.unshift(newUUID);
    return newModel;
  }

  async createManyLocalized(newOccupationSpecs: INewOccupationSpecLocalized[]): Promise<IOccupation[]> {
    const newOccupationsDocs: mongoose.Document<unknown, unknown, IOccupationDoc>[] = [];
    try {
      const newOccupationModels = newOccupationSpecs
        .map((spec) => {
          try {
            return this.newLocalizedSpecToModel(spec);
          } catch (e: unknown) {
            return null;
          }
        })
        .filter(Boolean);
      const docs = await this.Model.insertMany(newOccupationModels, { ordered: false });
      newOccupationsDocs.push(...docs);
    } catch (e: unknown) {
      const docs = handleInsertManyError<IOccupationDoc>(
        e,
        "OccupationRepository.createManyLocalized",
        newOccupationSpecs.length
      );
      newOccupationsDocs.push(...docs);
    }
    if (newOccupationSpecs.length !== newOccupationsDocs.length) {
      console.warn(
        `OccupationRepository.createManyLocalized: ${
          newOccupationSpecs.length - newOccupationsDocs.length
        } invalid entries were not created`
      );
    }
    return newOccupationsDocs.map((doc) => {
      populateEmptyOccupationHierarchy(doc);
      populateEmptyRequiresSkills(doc);
      return unwrapOccupationTranslatableFields(
        doc.toObject() as unknown as IOccupation,
        getFallbackLanguageConfig().dbKeyName
      );
    });
  }

  async findById(id: string | mongoose.Types.ObjectId, language?: string): Promise<IOccupation | null> {
    const lang = this.resolveLang(language);
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const occupation = await this.Model.findById(id)
        .populate(makePopulateOccupationParentOptions(lang))
        .populate(makePopulateOccupationChildrenOptions(lang))
        .populate(makePopulateOccupationRequiresSkillsOptions(lang))
        .exec();

      if (!occupation) return null;
      return unwrapOccupationTranslatableFields(occupation.toObject() as unknown as IOccupation, lang);
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findById: findById failed.", { cause: e });
      throw err;
    }
  }

  findAll(modelId: string, filter?: SearchFilter): Readable {
    // If occupationType is set then allow only ESCO or Local occupations
    if (
      filter?.occupationType !== undefined &&
      filter.occupationType !== ObjectTypes.ESCOOccupation &&
      filter.occupationType !== ObjectTypes.LocalOccupation
    ) {
      const err = new Error(
        "OccupationRepository.findAll: findAll failed. OccupationType must be either ESCO or LOCAL."
      );
      throw err;
    }

    // findAll is the canonical export path: it always uses the fallback language regardless of any
    // Accept-Language header, so that exported CSVs contain stable, predictable content.
    const fallbackLang = getFallbackLanguageConfig().dbKeyName;
    try {
      const unwrapTransform = new Transform({
        objectMode: true,
        transform(occupation: IOccupation, _encoding, callback) {
          try {
            callback(null, unwrapOccupationTranslatableFields(occupation, fallbackLang));
          } catch (e) {
            callback(e as Error);
          }
        },
      });

      const pipeline: Readable = stream.pipeline(
        // use $eq to prevent NoSQL injection
        this.Model.find({
          modelId: { $eq: modelId },
          ...(filter?.occupationType !== undefined ? { occupationType: { $eq: filter.occupationType } } : {}),
        }).cursor(), // in the current version we do not populate the parent, children or requiresSkills
        new DocumentToObjectTransformer<IOccupation>(),
        unwrapTransform,
        () => undefined
      );
      pipeline.on("error", (e) => {
        console.error("OccupationRepository.findAll: stream failed", e);
      });

      return pipeline;
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findAll: findAll failed", { cause: e });
      throw err;
    }
  }

  async findPaginated(
    modelId: string,
    limit: number,
    sortOrder: 1 | -1,
    cursorId?: string,
    filter?: Record<string, unknown>,
    search?: { value: string; fields: string[] },
    language?: string
  ): Promise<IOccupation[]> {
    const lang = this.resolveLang(language);
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      // Build the match stage
      const matchStage: Record<string, unknown> = { ...filter, modelId: modelIdObj };

      if (search) {
        matchStage.$and = [buildSearchCondition(search, TRANSLATABLE_FIELDS)];
      }

      // If a cursorId is provided, add it to the match stage to get results after the cursor
      if (cursorId && mongoose.Types.ObjectId.isValid(cursorId)) {
        const operator = sortOrder === -1 ? "$lt" : "$gt";
        matchStage._id = { [operator]: new mongoose.Types.ObjectId(cursorId) };
      }

      // Execute the aggregation pipeline
      // We use aggregation to handle filtering, sorting and limiting in a single query
      const results = await this.Model.aggregate([
        { $match: matchStage },
        { $sort: { _id: sortOrder } },
        { $limit: limit },
      ]).exec();

      // Hydrate the aggregation results to Mongoose documents
      // This is necessary because aggregate() returns plain objects, but populate() requires Mongoose documents
      const hydrated = results.map((r) => this.Model.hydrate(r));
      const populated = await this.Model.populate(hydrated, [
        makePopulateOccupationParentOptions(lang),
        makePopulateOccupationChildrenOptions(lang),
        makePopulateOccupationRequiresSkillsOptions(lang),
      ]);

      return populated.map((doc) => unwrapOccupationTranslatableFields(doc.toObject(), lang));
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findPaginated: findPaginated failed", { cause: e });
      throw err;
    }
  }

  async findByIds(modelId: string, ids: string[], language?: string): Promise<IOccupation[]> {
    const lang = this.resolveLang(language);
    try {
      const validIds = ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (validIds.length === 0) {
        return [];
      }
      const modelIdObj = new mongoose.Types.ObjectId(modelId);

      const results = await this.Model.aggregate([{ $match: { modelId: modelIdObj, _id: { $in: validIds } } }]).exec();

      const hydrated = results.map((r) => this.Model.hydrate(r));
      const populated = await this.Model.populate(hydrated, [
        makePopulateOccupationParentOptions(lang),
        makePopulateOccupationChildrenOptions(lang),
        makePopulateOccupationRequiresSkillsOptions(lang),
      ]);

      return populated.map((doc) => unwrapOccupationTranslatableFields(doc.toObject(), lang));
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findByIds: findByIds failed", { cause: e });
      throw err;
    }
  }

  async getOccupationByUUID(occupationUUID: string, language?: string): Promise<IOccupation | null> {
    const lang = this.resolveLang(language);
    try {
      const filter = {
        UUID: { $eq: occupationUUID },
      };
      const occupationInfo = await this.Model.findOne(filter)
        .populate([
          makePopulateOccupationParentOptions(lang),
          makePopulateOccupationChildrenOptions(lang),
          makePopulateOccupationRequiresSkillsOptions(lang),
        ])
        .exec();
      if (occupationInfo == null) {
        return null;
      }
      return unwrapOccupationTranslatableFields(occupationInfo.toObject() as unknown as IOccupation, lang);
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.getOccupationByUUID: getOccupationByUUID failed", {
        cause: e,
      });
      throw err;
    }
  }

  async findHistoryReferencesByUUIDs(uuids: string[], language?: string): Promise<IOccupationModelHistoryReference[]> {
    const lang = this.resolveLang(language);
    try {
      // Pass a bare array (not an explicit { $in: [...] }): mongoose applies $in automatically, and unlike an
      // operator object this is not rewritten by the connection's sanitizeFilter=true.
      const occupations = await this.Model.find(
        { UUID: uuids },
        {
          UUID: 1,
          _id: 1,
          modelId: 1,
          preferredLabel: 1,
          occupationGroupCode: 1,
          code: 1,
          occupationType: 1,
          isLocalized: 1,
        }
      ).exec();
      const byUUID = new Map(occupations.map((occupation) => [occupation.UUID, occupation]));
      // Map over the INPUT uuids to preserve order; null-fill for UUIDs that don't resolve to an occupation.
      return uuids.map((uuid) => {
        const occupation = byUUID.get(uuid);
        if (!occupation) {
          return { UUID: uuid, modelId: null, reference: null };
        }
        // Reuse the shared reference mapper; the reference itself does not carry the modelId, so split it out.
        const { modelId, ...reference } = getOccupationDocReference(occupation as OccupationDocument, lang);
        return { UUID: uuid, modelId: modelId.toString(), reference };
      });
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findHistoryReferencesByUUIDs: findHistoryReferencesByUUIDs failed", {
        cause: e,
      });
      console.error(err);
      throw err;
    }
  }

  async findParent(
    modelId: string,
    occupationId: string,
    language?: string
  ): Promise<IOccupation | IOccupationGroup | null> {
    const lang = this.resolveLang(language);
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const occupationIdObj = new mongoose.Types.ObjectId(occupationId);

      const pipeline: PipelineStage[] = [
        {
          $match: {
            modelId: modelIdObj,
            childId: occupationIdObj,
            childType: { $in: [ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation] },
          },
        },
        {
          $lookup: {
            from: this.Model.collection.name,
            let: { parentId: "$parentId" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$_id", "$$parentId"] }, { $eq: ["$modelId", modelIdObj] }] } } },
            ],
            as: "occupationParent",
          },
        },
        {
          $lookup: {
            from: this.Model.db.model(MongooseModelName.OccupationGroup).collection.name,
            let: { parentId: "$parentId" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$_id", "$$parentId"] }, { $eq: ["$modelId", modelIdObj] }] } } },
            ],
            as: "groupParent",
          },
        },
        {
          $addFields: {
            parent: {
              $cond: {
                if: { $eq: ["$parentDocModel", MongooseModelName.Occupation] },
                then: { $arrayElemAt: ["$occupationParent", 0] },
                else: { $arrayElemAt: ["$groupParent", 0] },
              },
            },
          },
        },
        {
          $match: {
            parent: { $ne: null },
          },
        },
        {
          $replaceRoot: {
            newRoot: "$parent",
          },
        },
      ];

      const HierarchyModel = this.Model.db.model(MongooseModelName.OccupationHierarchy);
      // Execute the aggregation pipeline to find and join the parent occupation
      const results = await HierarchyModel.aggregate(pipeline).exec();

      if (results.length === 0) {
        return null;
      }

      const r = results[0];

      // Hydrate and populate based on type
      if (r.occupationType === ObjectTypes.ESCOOccupation || r.occupationType === ObjectTypes.LocalOccupation) {
        const doc = this.Model.hydrate(r);
        await doc.populate([
          makePopulateOccupationChildrenOptions(lang),
          makePopulateOccupationRequiresSkillsOptions(lang),
        ]);
        return unwrapOccupationTranslatableFields(doc.toObject() as unknown as IOccupation, lang);
      } else {
        // hydrate().toObject() applies _TransformFn which flattens translatable fields to the fallback
        // language. We need the requested language instead: resolve translatable fields from the raw
        // aggregation result (which still has { en: "..." } plain objects), then overlay them on
        // the hydrated object so we keep the id virtual and all non-translatable fields.
        const OccupationGroupModel = this.Model.db.model(MongooseModelName.OccupationGroup);
        const obj = OccupationGroupModel.hydrate(r).toObject() as unknown as IOccupationGroup;
        const rawResolved = unwrapOccupationGroupTranslatableFields({ ...r }, lang) as IOccupationGroup;
        return {
          ...obj,
          preferredLabel: rawResolved.preferredLabel,
          description: rawResolved.description,
          altLabels: rawResolved.altLabels,
        };
      }
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findParent: findParent failed", { cause: e });
      throw err;
    }
  }

  async findChildren(
    modelId: string,
    occupationId: string,
    limit: number,
    cursor?: string,
    language?: string
  ): Promise<IOccupation[]> {
    const lang = this.resolveLang(language);
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const occupationIdObj = new mongoose.Types.ObjectId(occupationId);

      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        parentId: occupationIdObj,
        parentType: { $in: [ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation] },
        childType: { $in: [ObjectTypes.ESCOOccupation, ObjectTypes.LocalOccupation] },
      };

      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        matchStage.childId = { $gt: new mongoose.Types.ObjectId(cursor) };
      }

      const pipeline: PipelineStage[] = [
        // Match children hierarchy entries with optional cursor for pagination
        {
          $match: matchStage as PipelineStage.Match["$match"],
        },
        // Sort by childId to ensure consistent pagination order
        {
          $sort: { childId: 1 },
        },
        // Limit the results to the requested page size
        {
          $limit: limit,
        },
        // Join with the Occupations collection to get the child details
        {
          $lookup: {
            from: this.Model.collection.name,
            localField: "childId",
            foreignField: "_id",
            as: "child",
          },
        },
        // Flatten the joined 'child' array
        {
          $unwind: "$child",
        },
        // Promote the 'child' sub-document to the root
        {
          $replaceRoot: {
            newRoot: "$child",
          },
        },
      ];

      const HierarchyModel = this.Model.db.model(MongooseModelName.OccupationHierarchy);
      // Execute the aggregation pipeline
      const results = await HierarchyModel.aggregate(pipeline).exec();

      // Hydrate the plain objects into Mongoose documents
      const hydrated = results.map((r) => this.Model.hydrate(r));
      // Load nested relations (parents, children, skills) for each child
      const populated = await this.Model.populate(hydrated, [
        makePopulateOccupationParentOptions(lang),
        makePopulateOccupationChildrenOptions(lang),
        makePopulateOccupationRequiresSkillsOptions(lang),
      ]);

      return populated.map((doc) => unwrapOccupationTranslatableFields(doc.toObject(), lang));
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findChildren: findChildren failed", { cause: e });
      throw err;
    }
  }

  async findSkillsForOccupation(
    modelId: string,
    occupationId: string,
    limit: number,
    cursor?: string,
    language?: string
  ): Promise<ISkillWithRelation[]> {
    const lang = this.resolveLang(language);
    try {
      const modelIdObj = new mongoose.Types.ObjectId(modelId);
      const occupationIdObj = new mongoose.Types.ObjectId(occupationId);

      const matchStage: Record<string, unknown> = {
        modelId: modelIdObj,
        requiringOccupationId: occupationIdObj,
        requiringOccupationDocModel: MongooseModelName.Occupation,
      };

      if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
        matchStage.requiredSkillId = { $gt: new mongoose.Types.ObjectId(cursor) };
      }

      const RelationModel = this.Model.db.model(MongooseModelName.OccupationToSkillRelation);
      const SkillModel = this.Model.db.model(MongooseModelName.Skill);

      const pipeline: PipelineStage[] = [
        // Match the relation entries
        {
          $match: matchStage as PipelineStage.Match["$match"],
        },
        // Sort by requiredSkillId to ensure consistent pagination order
        {
          $sort: { requiredSkillId: 1 },
        },
        // Limit the results to the requested page size
        {
          $limit: limit,
        },
        // Join with the Skills collection to get the skill details
        {
          $lookup: {
            from: SkillModel.collection.name,
            localField: "requiredSkillId",
            foreignField: "_id",
            as: "skill",
          },
        },
        // Flatten the joined 'skill' array
        {
          $unwind: "$skill",
        },
        // Project the required fields, merging the skill data with relationship metadata
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                "$skill",
                {
                  relationType: "$relationType",
                  signallingValue: "$signallingValue",
                  signallingValueLabel: "$signallingValueLabel",
                },
              ],
            },
          },
        },
      ];

      // Execute the aggregation pipeline
      const results = await RelationModel.aggregate(pipeline).exec();

      // Hydrate the plain objects into Mongoose documents (using the SkillModel)
      const hydrated = results.map((r) => SkillModel.hydrate(r));

      // Map to objects and populate
      return hydrated.map((doc) => {
        populateEmptySkillHierarchy(doc);
        populateEmptySkillToSkillRelation(doc);
        populateEmptyRequiredByOccupations(doc);
        return unwrapSkillTranslatableFieldsForLanguage(doc.toObject(), lang) as ISkillWithRelation;
      });
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.findSkillsForOccupation: findSkillsForOccupation failed", {
        cause: e,
      });
      throw err;
    }
  }

  async update(id: string, modelId: string, spec: IUpdateOccupationSpec): Promise<IOccupation | null> {
    const fallbackLang = getFallbackLanguageConfig().dbKeyName;
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await this.Model.findOne({ _id: id, modelId: modelId }).exec();
      if (!doc) return null;
      doc.set(wrapTranslatableFields(spec, OCCUPATION_TRANSLATABLE_STRING_FIELDS, doc));
      await doc.save();
      // Write paths always return the fallback-language view; these factory overloads use fallback language.
      await doc.populate([
        populateOccupationParentOptions(),
        populateOccupationChildrenOptions(),
        populateOccupationRequiresSkillsOptions(),
      ]);
      return unwrapOccupationTranslatableFields(doc.toObject() as unknown as IOccupation, fallbackLang);
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.update: update failed.", { cause: e });
      throw err;
    }
  }

  async patch(id: string, modelId: string, spec: IPartialUpdateOccupationSpec): Promise<IOccupation | null> {
    const fallbackLang = getFallbackLanguageConfig().dbKeyName;
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await this.Model.findOne({ _id: id, modelId: modelId }).exec();
      if (!doc) return null;
      doc.set(wrapTranslatableFields(spec, OCCUPATION_TRANSLATABLE_STRING_FIELDS, doc));
      await doc.save();
      // Write paths always return the fallback-language view; these factory overloads use fallback language.
      await doc.populate([
        populateOccupationParentOptions(),
        populateOccupationChildrenOptions(),
        populateOccupationRequiresSkillsOptions(),
      ]);
      return unwrapOccupationTranslatableFields(doc.toObject() as unknown as IOccupation, fallbackLang);
    } catch (e: unknown) {
      const err = new Error("OccupationRepository.patch: patch failed.", { cause: e });
      throw err;
    }
  }
}
