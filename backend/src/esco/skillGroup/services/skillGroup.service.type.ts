import { ObjectTypes } from "esco/common/objectTypes";
import {
  INewSkillGroupSpecWithoutImportId,
  ISkillGroup,
  ISkillGroupChild,
  ISkillGroupReference,
  ModelForSkillGroupValidationErrorCode,
  IPartialUpdateSkillGroupSpec,
  IUpdateSkillGroupSpec,
  ValidateModelForSkillGroupResult,
} from "../_shared/skillGroup.types";
import { IModelInfoReference } from "modelInfo/modelInfo.types";
import { EmbeddableField } from "embeddings/service/types";

export interface ISkillGroupPaginatedFilter {
  childrenIds?: string;
  childrenType?: ObjectTypes.Skill | ObjectTypes.SkillGroup;
  root?: boolean;
}

/**
 * A single entry of a skill group's model history: the skill group's reference (as it appeared in that model)
 * together with a lightweight reference to the model it belonged to.
 */
export interface ISkillGroupHistoryEntry {
  entity: ISkillGroupReference;
  model: IModelInfoReference;
}

export class SkillGroupModelValidationError extends Error {
  constructor(public code: ModelForSkillGroupValidationErrorCode) {
    super();
  }
}

/**
 * Thrown when a translatable field of a create/update spec carries a language that is not in the
 * model's availableLanguages.
 */
export class SkillGroupLanguageValidationError extends Error {
  constructor(
    public field: string,
    public language: string
  ) {
    super(`${field} uses an unsupported language '${language}' for this model`);
  }
}

export enum SetSkillGroupParentErrorCode {
  CHILD_NOT_FOUND,
  PARENT_NOT_FOUND,
}

export class SetSkillGroupParentError extends Error {
  constructor(public code: SetSkillGroupParentErrorCode) {
    super();
  }
}

export interface ISkillGroupService {
  /**
   * Creates a new SkillGroup entry.
   *
   * @param {INewSkillGroupSpecWithoutImportId} newSkillGroupSpec - The specification for the new SkillGroup entry.
   * @return {Promise<ISkillGroup>} - A Promise that resolves to the newly created SkillGroup entry.
   * Rejects with an error if the SkillGroup entry cannot be created due to reasons other than validation.
   */
  create(newSkillGroupSpec: INewSkillGroupSpecWithoutImportId): Promise<ISkillGroup>;

  /**
   * Finds a SkillGroup by its id.
   *
   * @param {string} id - The id of the SkillGroup.
   * @param {string} [language] - The dbKeyName of the language to resolve the translatable fields to, each field
   * falling back to the fall back language. Defaults to the fall back language.
   * @return {Promise<ISkillGroup | null>} - The SkillGroup, or null if not found.
   */
  findById(id: string, language?: string): Promise<ISkillGroup | null>;

  findPaginated(
    modelId: string,
    cursor: { id: string; createdAt: Date } | undefined,
    limit: number,
    desc?: boolean,
    filter?: ISkillGroupPaginatedFilter,
    language?: string
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Searches the SkillGroups of a model by a free-text value on the given searchFields.
   *
   * Uses vector (embeddings) similarity ranked by relevance when the model is released and its embeddings have
   * been generated, and a case-insensitive regex match otherwise. The returned nextCursor is already encoded (its
   * shape depends on the strategy) and should be passed back verbatim as the `cursor` argument to fetch the next
   * page.
   *
   * @param {string} modelId - The modelId of the SkillGroups.
   * @param {string} searchValue - The free-text value to search for.
   * @param {EmbeddableField[]} searchFields - The fields to search the value on.
   * @param {string | undefined} cursor - The opaque pagination cursor from a previous page, if any.
   * @param {number} limit - The maximum number of SkillGroups to return.
   * @param {string} [language] - The dbKeyName of the language to match on and to resolve the returned fields to.
   * Defaults to the fall back language.
   * @return {Promise<{ items: ISkillGroup[]; nextCursor: string | null }>} - The page of SkillGroups (ordered by
   * relevance for vector search) and the encoded cursor of the next page, if any.
   */
  searchPaginated(
    modelId: string,
    searchValue: string,
    searchFields: EmbeddableField[],
    cursor: string | undefined,
    limit: number,
    language?: string
  ): Promise<{ items: ISkillGroup[]; nextCursor: string | null }>;

  /**
   * Validates that a model exists and is not released, for skill group write operations.
   * Whenever the model exists, a released one included, the result carries the model's availableLanguages so that
   * read endpoints can resolve the Accept-Language header against them.
   *
   * @param {string} modelId - The model ID to validate.
   * @return {Promise<ValidateModelForSkillGroupResult>} - The validation result.
   */
  validateModelForSkillGroup(modelId: string): Promise<ValidateModelForSkillGroupResult>;

  /**
   * Fully replaces the mutable fields of a SkillGroup (PUT semantics).
   * Validates that the model exists and is not released before updating.
   *
   * @param {string} id - The ID of the SkillGroup to update.
   * @param {string} modelId - The model ID the SkillGroup belongs to.
   * @param {IUpdateSkillGroupSpec} spec - The full set of new field values.
   * @return {Promise<ISkillGroup | null>} - The updated skill group, or null if not found.
   */
  update(id: string, modelId: string, spec: IUpdateSkillGroupSpec): Promise<ISkillGroup | null>;

  /**
   * Partially updates a SkillGroup (PATCH semantics).
   * Validates that the model exists and is not released before updating.
   *
   * @param {string} id - The ID of the SkillGroup to update.
   * @param {string} modelId - The model ID the SkillGroup belongs to.
   * @param {IPartialUpdateSkillGroupSpec} spec - Only the fields to update.
   * @return {Promise<ISkillGroup | null>} - The updated skill group, or null if not found.
   */
  patch(id: string, modelId: string, spec: IPartialUpdateSkillGroupSpec): Promise<ISkillGroup | null>;

  findParents(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string,
    language?: string
  ): Promise<{ items: ISkillGroup[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  findChildren(
    modelId: string,
    id: string,
    limit: number,
    cursor?: string,
    language?: string
  ): Promise<{ items: ISkillGroupChild[]; nextCursor: { _id: string; createdAt: Date } | null }>;

  /**
   * Sets the parent for a skill group by creating a hierarchy entry.
   * Throws SkillGroupModelValidationError if model is invalid.
   * Throws SetSkillGroupParentError if child or parent is not found.
   *
   * @param params.childId - The ID of the child skill group.
   * @param params.parentId - The ID of the parent skill group.
   * @param params.parentType - The type of the parent skill group.
   * @param params.modelId - The model ID.
   * @return {Promise<ISkillGroup>} - A Promise that resolves to the parent skill group.
   */
  setParent(params: {
    childId: string;
    parentId: string;
    parentType: ObjectTypes.SkillGroup;
    modelId: string;
  }): Promise<ISkillGroup>;

  /**
   * Resolves the history of the models a SkillGroup appeared in, based on its UUIDHistory.
   * For each UUID in the skill group's UUIDHistory (newest first) that resolves to an existing skill group,
   * returns the full model that skill group belonged to, together with that model's own UUIDHistory details.
   * UUIDs that do not resolve to an existing skill group are skipped, and each model appears at most once.
   *
   * @param {string} skillGroupId - The ID of the SkillGroup.
   * @param {string} [language] - The dbKeyName of the language to resolve the translatable fields to, each field
   * falling back to the fall back language. Defaults to the fall back language.
   * @return {Promise<ISkillGroupHistoryEntry[] | null>} - The resolved history entries in UUIDHistory order,
   * or null if the SkillGroup does not exist.
   */
  getHistory(skillGroupId: string, language?: string): Promise<ISkillGroupHistoryEntry[] | null>;
}
