import mongoose from "mongoose";
import { EmbeddableField } from "embeddings/service/types";
import {
  EntityEmbeddingIdPath,
  IEntityEmbeddingDoc,
  IOccupationEmbeddingDoc,
  IOccupationGroupEmbeddingDoc,
  ISkillEmbeddingDoc,
  ISkillGroupEmbeddingDoc,
} from "./entityEmbedding.types";
import { getGlobalTransformOptions } from "server/repositoryRegistry/globalTransform";

export const SkillEmbeddingModelName = "SkillEmbeddingModel";
export const SkillGroupEmbeddingModelName = "SkillGroupEmbeddingModel";
export const OccupationEmbeddingModelName = "OccupationEmbeddingModel";
export const OccupationGroupEmbeddingModelName = "OccupationGroupEmbeddingModel";

/**
 * The names of the collections that store the entity embeddings.
 * They are set explicitly (instead of relying on mongoose's pluralization of the model name),
 * so that the collections are named consistently with the rest of the schema design.
 */
export const SkillEmbeddingCollectionName = "skills_embeddings";
export const SkillGroupEmbeddingCollectionName = "skill_groups_embeddings";
export const OccupationEmbeddingCollectionName = "occupations_embeddings";
export const OccupationGroupEmbeddingCollectionName = "occupation_groups_embeddings";

/**
 * Builds the schema of an entity embeddings collection. All the collections share the same shape,
 * except for the entity-specific path under which the id of the embedded entity is stored.
 */
function buildEntityEmbeddingSchema<Doc extends IEntityEmbeddingDoc>(
  entityIdPath: EntityEmbeddingIdPath & keyof Doc
): mongoose.Schema<Doc> {
  const commonDefinition: mongoose.SchemaDefinition<IEntityEmbeddingDoc> = {
    modelId: { type: mongoose.Schema.Types.ObjectId, required: true },
    embeddingServiceId: { type: String, required: true },
    sourceHash: { type: String, required: true },
    sourceField: { type: String, required: true, enum: Object.values(EmbeddableField) },
    sourceText: { type: String, required: true },
    vector: {
      type: [Number],
      required: true,
      validate: {
        validator: (value: number[]) => Array.isArray(value) && value.length > 0,
        message: "Path `vector` must not be empty.",
      },
    },
  };
  // The entity-specific id path is the only part of the definition that the compiler cannot relate
  // to the generic Doc, since the path is a runtime value; the constraint on entityIdPath guarantees it.
  const schema = new mongoose.Schema<Doc>(
    {
      ...commonDefinition,
      [entityIdPath]: { type: mongoose.Schema.Types.ObjectId, required: true },
    } as unknown as mongoose.SchemaDefinition<Doc>,
    {
      timestamps: true,
      strict: "throw",
      toObject: getGlobalTransformOptions(),
      toJSON: getGlobalTransformOptions(),
    }
  );
  // There is at most one embedding per (model, entity, embedding service, source field).
  schema.index({ modelId: 1, [entityIdPath]: 1, embeddingServiceId: 1, sourceField: 1 }, { unique: true });
  return schema;
}

export function initializeSkillEmbeddingSchemaAndModel(
  dbConnection: mongoose.Connection
): mongoose.Model<ISkillEmbeddingDoc> {
  return dbConnection.model<ISkillEmbeddingDoc>(
    SkillEmbeddingModelName,
    buildEntityEmbeddingSchema<ISkillEmbeddingDoc>(EntityEmbeddingIdPath.skillId),
    SkillEmbeddingCollectionName
  );
}

export function initializeSkillGroupEmbeddingSchemaAndModel(
  dbConnection: mongoose.Connection
): mongoose.Model<ISkillGroupEmbeddingDoc> {
  return dbConnection.model<ISkillGroupEmbeddingDoc>(
    SkillGroupEmbeddingModelName,
    buildEntityEmbeddingSchema<ISkillGroupEmbeddingDoc>(EntityEmbeddingIdPath.skillGroupId),
    SkillGroupEmbeddingCollectionName
  );
}

export function initializeOccupationEmbeddingSchemaAndModel(
  dbConnection: mongoose.Connection
): mongoose.Model<IOccupationEmbeddingDoc> {
  return dbConnection.model<IOccupationEmbeddingDoc>(
    OccupationEmbeddingModelName,
    buildEntityEmbeddingSchema<IOccupationEmbeddingDoc>(EntityEmbeddingIdPath.occupationId),
    OccupationEmbeddingCollectionName
  );
}

export function initializeOccupationGroupEmbeddingSchemaAndModel(
  dbConnection: mongoose.Connection
): mongoose.Model<IOccupationGroupEmbeddingDoc> {
  return dbConnection.model<IOccupationGroupEmbeddingDoc>(
    OccupationGroupEmbeddingModelName,
    buildEntityEmbeddingSchema<IOccupationGroupEmbeddingDoc>(EntityEmbeddingIdPath.occupationGroupId),
    OccupationGroupEmbeddingCollectionName
  );
}
