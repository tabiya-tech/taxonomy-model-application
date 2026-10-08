import fs from "fs";
import path from "path";
import { createHash, randomUUID } from "crypto";
import mongoose, { Connection } from "mongoose";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

import LanguageAPISpecs from "api-specifications/language";
import ModelInfoAPISpecs from "api-specifications/modelInfo";

import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getTestString } from "_test_utilities/getMockRandomData";
import {
  getLanguageSuffixedHeader,
  OccupationGroupTranslatableHeaders,
  occupationTranslatableHeaders,
} from "esco/common/entityToCSV.types";
import {
  arrayFromString,
  stringFromArray,
  uniqueArrayFromString,
} from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { parseOccupationGroupsFromFile } from "import/esco/OccupationGroups/OccupationGroupsParser";
import { parseOccupationsFromFile } from "import/esco/occupations/occupationsParser";
import { EmbeddingProcessService } from "embeddings/embeddingProcess/embeddingProcess.service";
import { EmbeddingService } from "embeddings/service/service";
import { IGenerateEmbeddingTask } from "embeddings/service/types";
import { IEmbeddingClient } from "embeddings/service/client";
import { IAsyncPublishEmbeddingsTaskInvoker } from "embeddings/asyncPublishEmbeddingsTask/asyncPublishEmbeddingsTask.types";
import { EmbeddingModelServiceFactory } from "embeddings/models/embeddingModelServiceFactory";
import { OccupationEmbeddingCollectionName } from "embeddings/entityEmbeddings/entityEmbeddingModel";
import { OccupationsEmbeddingsVectorSearchIndexName } from "embeddings/entityEmbeddings/vectorSearchIndex.constant";
import { createSkillsVectorSearchIndex } from "../../../scripts/createVectorSearchIndex";
import { ILabelledQueryRow } from "../../../scripts/translateEmbeddingsEvalQueries";
import {
  IEmbeddingsStorage,
  IEvalCase,
  IEvalModel,
  IEvalQuery,
  IQueryResult,
  QuerySet,
} from "./multilingualEmbeddings.types";

// The data sets must describe the same occupations (aligned by ORIGINURI), and the first one must be in the fallback
// language. Adding a language to the evaluation starts here.
export const ESCO_DATA_FOLDER_BY_LANGUAGE: Record<string, string> = {
  en: "../data-sets/csv/esco-v1.1.2/",
  fr: "../data-sets/csv/esco-v1.1.2(fr)/",
};

// The batch size of the embeddings queue, see iac/backend/src/embeddingsQueue.ts.
const QUEUE_BATCH_SIZE = 10;
// As concurrent lambdas would.
const EMBEDDING_CONCURRENCY = 5;
const INDEX_READY_TIMEOUT_MS = 10 * 60 * 1000;

type CSVRow = Record<string, string>;

function readCSVRows(filePath: string): CSVRow[] {
  return parse(fs.readFileSync(filePath), { columns: true, skip_empty_lines: true });
}

function getLanguageConfig(dbKeyName: string): LanguageAPISpecs.Types.ILanguageConfig {
  const language = LanguageAPISpecs.Constants.Languages.find((l) => l.dbKeyName === dbKeyName);
  if (!language) {
    throw new Error(`'${dbKeyName}' is not a registered language`);
  }
  return language;
}

/**
 * Merges the unsuffixed CSV file of each language's data set into one localized CSV file (PREFERREDLABEL_EN, ...).
 *
 * The alt labels of the other languages are cut to the number of alt labels of the first one: the import pairs alt
 * labels across languages by position, and rejects the whole entity when an alt label has no fallback translation.
 */
function writeLocalizedCSVFile(
  fileName: string,
  translatableHeaders: readonly string[],
  languages: string[],
  outputFolder: string
): string {
  const rowsByLanguage = languages.map(
    (language) =>
      new Map(
        readCSVRows(path.join(ESCO_DATA_FOLDER_BY_LANGUAGE[language], fileName)).map((row) => [row.ORIGINURI, row])
      )
  );
  const mergedRows = [...rowsByLanguage[0].values()].map((baseRow) => {
    const mergedRow: CSVRow = {};
    for (const [header, value] of Object.entries(baseRow)) {
      if (!translatableHeaders.includes(header)) {
        mergedRow[header] = value;
        continue;
      }
      languages.forEach((language, index) => {
        const row = rowsByLanguage[index].get(baseRow.ORIGINURI);
        if (!row) {
          throw new Error(`${fileName}: ${baseRow.ORIGINURI} is missing from the '${language}' data set`);
        }
        let languageValue = row[header];
        if (header === "ALTLABELS" && index > 0) {
          const baseCount = uniqueArrayFromString(baseRow[header]).uniqueArray.length;
          languageValue = stringFromArray(uniqueArrayFromString(languageValue).uniqueArray.slice(0, baseCount));
        }
        mergedRow[getLanguageSuffixedHeader(header, getLanguageConfig(language))] = languageValue;
      });
    }
    return mergedRow;
  });

  fs.mkdirSync(outputFolder, { recursive: true });
  const outputFile = path.join(outputFolder, fileName);
  fs.writeFileSync(outputFile, stringify(mergedRows, { header: true, quoted: true }));
  return outputFile;
}

/**
 * Connects the way the lambdas do, and drops the database, in case a previous run was interrupted.
 */
export async function connectToEvalDatabase(dbURI: string, geminiApiKey: string): Promise<Connection> {
  const configModule = await import("server/config/config");
  jest
    .spyOn(configModule, "readEnvironmentConfiguration")
    .mockReturnValue({ ...getTestConfiguration("unused"), dbURI, geminiApiKey });
  await initOnce();
  const connection = getConnectionManager().getCurrentDBConnection();
  if (!connection) {
    // initOnce logs its errors instead of throwing them, and the console is muted
    throw new Error(`Failed to connect to the evaluation database ${dbURI}`);
  }
  await connection.dropDatabase();
  return connection;
}

export async function importESCOOccupationsModel(languages: string[], csvFolder: string): Promise<IEvalModel> {
  const model = await getRepositoryRegistry().modelInfo.create({
    name: "EmbeddingsEval",
    description: "EmbeddingsEval",
    UUIDHistory: [randomUUID()],
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    locale: { name: "en", UUID: randomUUID(), shortCode: "en" },
    availableLanguages: languages,
  });

  const groupsFile = writeLocalizedCSVFile(
    "occupation_groups.csv",
    OccupationGroupTranslatableHeaders,
    languages,
    csvFolder
  );
  const occupationsFile = writeLocalizedCSVFile("occupations.csv", occupationTranslatableHeaders, languages, csvFolder);
  const importIdToDBIdMap = new Map<string, string>();
  const groupsStats = await parseOccupationGroupsFromFile(model.id, groupsFile, importIdToDBIdMap, languages);
  const occupationsStats = await parseOccupationsFromFile(model.id, occupationsFile, importIdToDBIdMap, languages);
  if (groupsStats.rowsFailed > 0 || occupationsStats.rowsFailed > 0) {
    throw new Error(
      `Failed to import ${groupsStats.rowsFailed} occupation group(s) and ${occupationsStats.rowsFailed} occupation(s)`
    );
  }

  const occupations = await getRepositoryRegistry().occupation.Model.find({ modelId: model.id }, { code: 1 }).lean();
  return {
    id: model.id,
    codeByOccupationId: new Map(occupations.map((occupation) => [`${occupation._id}`, occupation.code])),
  };
}

async function forEachWithConcurrency<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      await task(items[next++]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

/**
 * Embeds every entity of the model in every language with the production embedding process and service. The tasks
 * are published to a list instead of the queue, and processed in batches of the queue's size.
 */
export async function embedModel(
  modelId: string,
  embeddingServiceId: string,
  embeddingModelServiceFactory: EmbeddingModelServiceFactory
): Promise<void> {
  const registry = getRepositoryRegistry();
  const publishedTasks: IGenerateEmbeddingTask[] = [];
  const listEmbeddingClient: IEmbeddingClient = {
    pushTaskToQueue: async (task) => void publishedTasks.push(task),
    pushTasksToQueue: async (tasks) => void publishedTasks.push(...tasks),
  };
  const embeddingProcessService = new EmbeddingProcessService(
    registry.modelInfo,
    registry.embeddingProcessState,
    registry.skill,
    registry.skillGroup,
    registry.occupation,
    registry.OccupationGroup,
    listEmbeddingClient,
    {} as IAsyncPublishEmbeddingsTaskInvoker // not needed to publish the tasks
  );
  const embeddingService = new EmbeddingService({
    skillRepository: registry.skill,
    skillGroupRepository: registry.skillGroup,
    occupationRepository: registry.occupation,
    occupationGroupRepository: registry.OccupationGroup,
    skillEmbeddingRepository: registry.skillEmbedding,
    skillGroupEmbeddingRepository: registry.skillGroupEmbedding,
    occupationEmbeddingRepository: registry.occupationEmbedding,
    occupationGroupEmbeddingRepository: registry.occupationGroupEmbedding,
    embeddingProcessStateRepository: registry.embeddingProcessState,
    embeddingModelServiceFactory,
  });

  const processState = await registry.embeddingProcessState.create({
    modelId,
    status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.PENDING,
    embeddingServiceId,
    totalDocuments: 0,
    errorCounts: 0,
    warningCounts: 0,
    completedDocuments: 0,
  });
  await embeddingProcessService.publishEmbeddingTasks(processState.id, modelId, embeddingServiceId);
  const batches = Array.from({ length: Math.ceil(publishedTasks.length / QUEUE_BATCH_SIZE) }, (_, i) =>
    publishedTasks.slice(i * QUEUE_BATCH_SIZE, (i + 1) * QUEUE_BATCH_SIZE)
  );
  await forEachWithConcurrency(batches, EMBEDDING_CONCURRENCY, (batch) => embeddingService.processTasks(batch));

  // the embedding service records a failed embedding on the process instead of throwing
  const completedProcessState = await registry.embeddingProcessState.findById(processState.id);
  if (completedProcessState?.errorCounts !== 0 || completedProcessState.completedDocuments !== publishedTasks.length) {
    throw new Error(`Failed to embed ${completedProcessState?.errorCounts} of ${publishedTasks.length} entities`);
  }
}

/**
 * Creates the production vector search index, and waits until it has indexed the existing embeddings.
 */
export async function createOccupationsVectorSearchIndex(connection: Connection): Promise<void> {
  await createSkillsVectorSearchIndex(connection, {
    collectionName: OccupationEmbeddingCollectionName,
    indexName: OccupationsEmbeddingsVectorSearchIndexName,
  });
  const deadline = Date.now() + INDEX_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const [index] = await connection.db
      .collection(OccupationEmbeddingCollectionName)
      .aggregate([{ $listSearchIndexes: { name: OccupationsEmbeddingsVectorSearchIndexName } }])
      .toArray();
    if (index?.status === "READY" && index?.queryable) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`The vector search index ${OccupationsEmbeddingsVectorSearchIndexName} did not become queryable`);
}

/**
 * Whether an alt label paraphrases the preferred label, rather than repeating one of its spellings: ESCO preferred
 * labels often list their gendered forms (e.g. "poseur de plafonds/poseuse de plafonds"), and alt labels often repeat
 * one of them, or a singular/plural variant of it.
 */
function isParaphraseOf(altLabel: string, preferredLabel: string): boolean {
  const normalize = (label: string) => label.trim().toLowerCase();
  const normalizedAltLabel = normalize(altLabel);
  const preferredForms = [preferredLabel, ...preferredLabel.split("/")].map(normalize);
  return preferredForms.every((form) => !form.includes(normalizedAltLabel) && !normalizedAltLabel.includes(form));
}

/**
 * One query per occupation, whose text in each language is one of its alt labels that paraphrases its preferred
 * label, picked by a hash so that the query set is the same on every run.
 */
function buildAltLabelQueries(languages: string[]): IEvalQuery[] {
  const queriesByOriginUri = new Map<string, IEvalQuery>();
  for (const language of languages) {
    for (const row of readCSVRows(path.join(ESCO_DATA_FOLDER_BY_LANGUAGE[language], "occupations.csv"))) {
      const query = queriesByOriginUri.get(row.ORIGINURI) ?? { id: row.ORIGINURI, goldCode: row.CODE, text: {} };
      const candidates = arrayFromString(row.ALTLABELS).filter((altLabel) =>
        isParaphraseOf(altLabel, row.PREFERREDLABEL)
      );
      if (candidates.length > 0) {
        const hash = createHash("md5").update(`${row.ORIGINURI}:${language}`).digest();
        query.text[language] = candidates[hash.readUInt32BE(0) % candidates.length];
      }
      queriesByOriginUri.set(row.ORIGINURI, query);
    }
  }
  return [...queriesByOriginUri.values()];
}

/**
 * Each query set is restricted to the queries written in every language, so that all its cases evaluate the same
 * occupations.
 */
export function loadQuerySets(
  model: IEvalModel,
  languages: string[],
  labelledQueriesPath: string | undefined
): Partial<Record<QuerySet, IEvalQuery[]>> {
  const querySets: Partial<Record<QuerySet, IEvalQuery[]>> = {
    [QuerySet.ESCO_ALT_LABEL]: buildAltLabelQueries(languages),
  };
  if (labelledQueriesPath) {
    const rows: ILabelledQueryRow[] = JSON.parse(fs.readFileSync(labelledQueriesPath, "utf-8"));
    querySets[QuerySet.LABELLED_TITLE] = rows.map((row) => ({ id: row.id, goldCode: row.goldCode, text: row.title }));
    querySets[QuerySet.LABELLED_EXPERIENCE] = rows.map((row) => ({
      id: row.id,
      goldCode: row.goldCode,
      text: row.experience,
    }));
  }

  const codes = new Set(model.codeByOccupationId.values());
  for (const [querySet, queries] of Object.entries(querySets) as [QuerySet, IEvalQuery[]][]) {
    const unknownCodes = queries.filter((query) => !codes.has(query.goldCode)).map((query) => query.goldCode);
    if (unknownCodes.length > 0) {
      throw new Error(`The ${querySet} queries are labelled with unknown occupations: ${unknownCodes.join(", ")}`);
    }
    querySets[querySet] = queries.filter((query) => languages.every((language) => query.text[language] !== undefined));
  }
  return querySets;
}

/**
 * Searches like the search endpoints do, except that the queries are embedded in one batch instead of one request
 * each, which yields the same vectors.
 */
export async function searchQueries(
  model: IEvalModel,
  evalCase: IEvalCase,
  queries: IEvalQuery[],
  embeddingServiceId: string,
  embeddingModelServiceFactory: EmbeddingModelServiceFactory,
  topK: number
): Promise<IQueryResult[]> {
  const queryTexts = queries.map((query) => query.text[evalCase.queryLanguage] as string);
  const queryVectors = await embeddingModelServiceFactory(embeddingServiceId).generateEmbeddingBatch(queryTexts);

  const results: IQueryResult[] = [];
  for (const [i, query] of queries.entries()) {
    const hits = await getRepositoryRegistry().occupationEmbedding.vectorSearch({
      indexName: OccupationsEmbeddingsVectorSearchIndexName,
      modelId: model.id,
      embeddingServiceId,
      language: evalCase.storedLanguage,
      queryVector: queryVectors[i],
      searchFields: evalCase.searchFields,
      limit: topK,
      offset: 0,
    });
    results.push({
      queryId: query.id,
      queryText: queryTexts[i],
      goldCode: query.goldCode,
      rankedCodes: hits.map((hit) => model.codeByOccupationId.get(hit.entityId) ?? hit.entityId),
      scores: hits.map((hit) => hit.score),
    });
  }
  return results;
}

export async function getEmbeddingsStorage(modelId: string): Promise<IEmbeddingsStorage> {
  const storage = await getRepositoryRegistry()
    .occupationEmbedding.Model.aggregate([
      { $match: { modelId: new mongoose.Types.ObjectId(modelId) } },
      { $group: { _id: "$language", documents: { $sum: 1 }, bytes: { $sum: { $bsonSize: "$$ROOT" } } } },
    ])
    .exec();
  return Object.fromEntries(storage.map((entry) => [entry._id, { documents: entry.documents, bytes: entry.bytes }]));
}
