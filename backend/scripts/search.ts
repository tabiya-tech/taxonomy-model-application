import { getNewConnection } from "../src/server/connection/newConnection";
import { getDbURI, readEnvironmentConfiguration, setConfiguration } from "../src/server/config/config";
import { getRepositoryRegistry } from "../src/server/repositoryRegistry/repositoryRegistry";
import { getEmbeddingModelService } from "../src/embeddings/models/embeddingModelServiceFactory";
import { EmbeddableField } from "../src/embeddings/service/types";
import { IEntityEmbeddingRepository } from "../src/embeddings/entityEmbeddings/entityEmbeddingRepository";
import {
  OccupationGroupsEmbeddingsVectorSearchIndexName,
  OccupationsEmbeddingsVectorSearchIndexName,
  SkillGroupsEmbeddingsVectorSearchIndexName,
  SkillsEmbeddingsVectorSearchIndexName,
} from "../src/embeddings/entityEmbeddings/vectorSearchIndex.constant";

/**
 * A CLI helper to run sample vector-similarity searches against an entity embeddings collection.
 *
 * It goes exclusively through the existing repositories and the embedding model service (never touching the
 * database directly): the search value is embedded with the given embedding service, the resulting vector is
 * fed to the collection's `vectorSearch`, and every ranked hit is hydrated to its entity via that entity's
 * repository so the results are human-readable.
 *
 * It requires an Atlas Vector Search index to exist on the collection (see scripts/createVectorSearchIndex.ts),
 * so it only works against a real Atlas deployment.
 *
 * Usage:
 *   yarn search --model <modelId> --service <embeddingServiceId> --collection <collection> --query "<text>"
 *
 *   --model <modelId>            (required) The id of the taxonomy model whose entities to search.
 *   --service <serviceId>        (required) The id of the embedding service to embed the query with.
 *                                Must be the same service the model was embedded with.
 *   --collection <name>          (optional, default: skill) One of: skill, skillGroup, occupation, occupationGroup.
 *   --query "<text>"             (required, repeatable) The search value. Pass it multiple times to run
 *                                several sample searches in one go.
 *   --fields <a,b,c>             (optional, default: all fields) The source fields to search on
 *                                (preferredLabel, description, altLabels, scopeNote).
 *   --limit <n>                  (optional, default: 10) The maximum number of hits per query.
 *
 * Example:
 *   yarn search --model 6123abc... --service 77bb8ff3-a6b0-460b-bcaa-00631a907852 \
 *     --collection skill --query "software developer" --query "welding" --limit 5
 */

/**
 * The minimal shape of an entity as returned by its repository, used only to display a hit.
 */
interface IDisplayableEntity {
  id: string;
  preferredLabel?: string;
  code?: string;
}

/**
 * The minimal shape of an entity repository the script needs to hydrate a ranked hit.
 */
interface IHydratingRepository {
  findById(id: string): Promise<IDisplayableEntity | null>;
}

/**
 * Everything the script needs to search one collection: the embeddings repository to search, the
 * Atlas Vector Search index to use, and the entity repository to hydrate the ranked hits with.
 */
interface ICollectionConfig {
  indexName: string;
  // Only the entity-agnostic vectorSearch is needed, so all four collections' repositories share this shape.
  embeddingRepository: Pick<IEntityEmbeddingRepository, "vectorSearch">;
  entityRepository: IHydratingRepository;
}

type CollectionName = "skill" | "skillGroup" | "occupation" | "occupationGroup";

/**
 * Builds the per-collection configuration from the (already initialized) repository registry.
 */
function getCollectionConfigs(): Record<CollectionName, ICollectionConfig> {
  const registry = getRepositoryRegistry();
  return {
    skill: {
      indexName: SkillsEmbeddingsVectorSearchIndexName,
      embeddingRepository: registry.skillEmbedding,
      entityRepository: registry.skill as unknown as IHydratingRepository,
    },
    skillGroup: {
      indexName: SkillGroupsEmbeddingsVectorSearchIndexName,
      embeddingRepository: registry.skillGroupEmbedding,
      entityRepository: registry.skillGroup as unknown as IHydratingRepository,
    },
    occupation: {
      indexName: OccupationsEmbeddingsVectorSearchIndexName,
      embeddingRepository: registry.occupationEmbedding,
      entityRepository: registry.occupation as unknown as IHydratingRepository,
    },
    occupationGroup: {
      indexName: OccupationGroupsEmbeddingsVectorSearchIndexName,
      embeddingRepository: registry.occupationGroupEmbedding,
      entityRepository: registry.OccupationGroup as unknown as IHydratingRepository,
    },
  };
}

interface IParsedArgs {
  modelId: string;
  embeddingServiceId: string;
  collection: CollectionName;
  queries: string[];
  fields: EmbeddableField[];
  limit: number;
}

/**
 * Parses the command-line arguments into the search parameters, applying defaults and validating them.
 * Throws with a helpful message on any missing/invalid argument.
 */
export function parseArgs(argv: string[]): IParsedArgs {
  const values: Record<string, string[]> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new Error(`Missing value for argument --${key}`);
      }
      (values[key] ??= []).push(value);
      i++;
    }
  }

  const modelId = values.model?.[0];
  if (!modelId) {
    throw new Error("Missing required argument --model <modelId>");
  }

  const embeddingServiceId = values.service?.[0];
  if (!embeddingServiceId) {
    throw new Error("Missing required argument --service <embeddingServiceId>");
  }

  const queries = values.query ?? [];
  if (queries.length === 0) {
    throw new Error("Missing required argument --query <text> (repeatable)");
  }

  const collection = (values.collection?.[0] ?? "skill") as CollectionName;
  const validCollections: CollectionName[] = ["skill", "skillGroup", "occupation", "occupationGroup"];
  if (!validCollections.includes(collection)) {
    throw new Error(`Invalid --collection '${collection}'. Must be one of: ${validCollections.join(", ")}`);
  }

  const allFields = Object.values(EmbeddableField);
  const fields = values.fields
    ? values.fields[0].split(",").map((field) => field.trim())
    : (allFields as string[]);
  const invalidField = fields.find((field) => !allFields.includes(field as EmbeddableField));
  if (invalidField) {
    throw new Error(`Invalid --fields entry '${invalidField}'. Must be one of: ${allFields.join(", ")}`);
  }

  const limit = values.limit ? Number.parseInt(values.limit[0], 10) : 10;
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error(`Invalid --limit '${values.limit?.[0]}'. Must be a positive integer`);
  }

  return { modelId, embeddingServiceId, collection, queries, fields: fields as EmbeddableField[], limit };
}

/**
 * Runs one sample search and prints its ranked results.
 */
async function runSearch(config: ICollectionConfig, args: IParsedArgs, query: string): Promise<void> {
  console.info(`\nQuery: ${query}"`);

  const startedAt = Date.now();

  // Embed the search value with the same embedding service the model was embedded with.
  const embeddingModelService = getEmbeddingModelService(args.embeddingServiceId);
  const queryVector = await embeddingModelService.generateEmbedding(query);

  // Search the collection with the query vector.
  const hits = await config.embeddingRepository.vectorSearch({
    indexName: config.indexName,
    modelId: args.modelId,
    embeddingServiceId: args.embeddingServiceId,
    queryVector,
    searchFields: args.fields,
    limit: args.limit,
    offset: 0,
  });

  const elapsedMs = Date.now() - startedAt;
  console.info(`  (found ${hits.length} result(s) in ${elapsedMs} ms)`);

  if (hits.length === 0) {
    console.info("  (no results)");
    return;
  }

  // Hydrate each ranked hit to its entity so the output is human-readable.
  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i];
    const entity = await config.entityRepository.findById(hit.entityId);
    const label = entity?.preferredLabel ?? "(entity not found)";
    const code = entity?.code ? ` [${entity.code}]` : "";
    console.info(`  ${String(i + 1).padStart(2)}. ${hit.score.toFixed(4)}  ${label}${code}  (${hit.entityId})`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  setConfiguration(readEnvironmentConfiguration());
  const connection = await getNewConnection(getDbURI());
  try {
    await getRepositoryRegistry().initialize(connection);
    const config = getCollectionConfigs()[args.collection];

    console.info(
      `Searching '${args.collection}' embeddings of model ${args.modelId} ` +
        `with embedding service ${args.embeddingServiceId} on fields [${args.fields.join(", ")}].`
    );

    for (const query of args.queries) {
      await runSearch(config, args, query);
    }
  } finally {
    await connection.close(false);
  }
}

// Only run when invoked directly (not when imported by a test).
if (require.main === module) {
  main()
    .then(() => {
      console.info("\nSearch completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Search failed:", error);
      process.exit(1);
    });
}
