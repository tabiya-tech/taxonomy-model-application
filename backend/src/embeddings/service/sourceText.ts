import { createHash } from "node:crypto";
import { EmbeddableField } from "./types";

/**
 * Describes the subset of an entity (skill, skill group, occupation, occupation group)
 * that can be turned into source texts for embeddings.
 */
export interface IEmbeddableEntity {
  id: string;
  modelId: string;
  preferredLabel: string;
  altLabels: string[];
  description: string;
  scopeNote?: string;
}

/**
 * Builds the source text of the given field of the given entity.
 * Array fields (altLabels) are joined with a newline, so that each label contributes to the embedding.
 * Fields that the entity does not have resolve to an empty string.
 */
export function getSourceText(entity: IEmbeddableEntity, field: EmbeddableField): string {
  const value = (entity as unknown as Record<string, unknown>)[field];
  if (Array.isArray(value)) {
    return value.join("\n");
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

/**
 * Computes the hash of a source text, in the format stored in the sourceHash path of the entity embeddings
 * (`md5:<md5-hash-of-the-text>`). It is used to detect whether the source text of an existing embedding
 * has changed, so unchanged texts are not re-embedded.
 */
export function computeSourceHash(sourceText: string): string {
  return `md5:${createHash("md5").update(sourceText).digest("hex")}`;
}
