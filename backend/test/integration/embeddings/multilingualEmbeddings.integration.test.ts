// Suppress chatty console during the tests
import "_test_utilities/consoleMock";
import "_test_utilities/mockSentry";

import path from "path";
import { Connection } from "mongoose";

import EmbeddingsAPISpecs from "api-specifications/embeddings";

import { EmbeddableField } from "embeddings/service/types";
import { getCachingEmbeddingModelServiceFactory } from "./cachingEmbeddingModelService";
import {
  connectToEvalDatabase,
  createOccupationsVectorSearchIndex,
  embedModel,
  ESCO_DATA_FOLDER_BY_LANGUAGE,
  getEmbeddingsStorage,
  importESCOOccupationsModel,
  loadQuerySets,
  searchQueries,
} from "./multilingualEmbeddings.utils";
import { IEvalCase, IEvalModel, IEvalQuery, IQueryResult, QuerySet } from "./multilingualEmbeddings.types";
import { writeReport } from "./report";

/**
 * Compares per-language embeddings with a single English embedding per entity. Each case only asserts that it ran;
 * the comparison is in the report it writes.
 *
 * Needs a MongoDB with Atlas Vector Search, e.g. `docker run -d -p 27018:27017 mongodb/mongodb-atlas-local:8.0`, and
 * is skipped unless EMBEDDINGS_EVAL_MONGODB_URI (dropped before and after the run) and GEMINI_API_KEY are set.
 * The labelled cases also need EMBEDDINGS_EVAL_LABELLED_QUERIES_PATH (see scripts/translateEmbeddingsEvalQueries.ts),
 * which must not be committed.
 */
const EVAL_MONGODB_URI = process.env.EMBEDDINGS_EVAL_MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const LABELLED_QUERIES_PATH = process.env.EMBEDDINGS_EVAL_LABELLED_QUERIES_PATH;
const WORK_DIR = path.resolve(process.env.EMBEDDINGS_EVAL_WORK_DIR ?? "tmp/embeddings-eval");

const EMBEDDING_SERVICE_ID = EmbeddingsAPISpecs.Constants.EmbeddingServiceIds[0];
const MODEL_LANGUAGES = Object.keys(ESCO_DATA_FOLDER_BY_LANGUAGE);
const TOP_K = 10;

// The default of the search endpoints.
const LABEL_FIELDS = [EmbeddableField.preferredLabel];
const ALL_FIELDS = [EmbeddableField.preferredLabel, EmbeddableField.altLabels, EmbeddableField.description];

// For each query set: fr -> fr is production today, fr -> en is a single English embedding, en -> en is the baseline.
// The alt label queries are stored in the altLabels field, so they are only searched on the preferredLabel field.
const ESCO_ALT_LABEL_CASES: IEvalCase[] = [
  { querySet: QuerySet.ESCO_ALT_LABEL, queryLanguage: "fr", storedLanguage: "fr", searchFields: LABEL_FIELDS },
  { querySet: QuerySet.ESCO_ALT_LABEL, queryLanguage: "fr", storedLanguage: "en", searchFields: LABEL_FIELDS },
  { querySet: QuerySet.ESCO_ALT_LABEL, queryLanguage: "en", storedLanguage: "en", searchFields: LABEL_FIELDS },
];
const LABELLED_CASES: IEvalCase[] = [
  { querySet: QuerySet.LABELLED_TITLE, queryLanguage: "fr", storedLanguage: "fr", searchFields: LABEL_FIELDS },
  { querySet: QuerySet.LABELLED_TITLE, queryLanguage: "fr", storedLanguage: "en", searchFields: LABEL_FIELDS },
  { querySet: QuerySet.LABELLED_TITLE, queryLanguage: "en", storedLanguage: "en", searchFields: LABEL_FIELDS },
  { querySet: QuerySet.LABELLED_TITLE, queryLanguage: "fr", storedLanguage: "fr", searchFields: ALL_FIELDS },
  { querySet: QuerySet.LABELLED_TITLE, queryLanguage: "fr", storedLanguage: "en", searchFields: ALL_FIELDS },
  { querySet: QuerySet.LABELLED_TITLE, queryLanguage: "en", storedLanguage: "en", searchFields: ALL_FIELDS },

  { querySet: QuerySet.LABELLED_EXPERIENCE, queryLanguage: "fr", storedLanguage: "fr", searchFields: LABEL_FIELDS },
  { querySet: QuerySet.LABELLED_EXPERIENCE, queryLanguage: "fr", storedLanguage: "en", searchFields: LABEL_FIELDS },
  { querySet: QuerySet.LABELLED_EXPERIENCE, queryLanguage: "en", storedLanguage: "en", searchFields: LABEL_FIELDS },
  { querySet: QuerySet.LABELLED_EXPERIENCE, queryLanguage: "fr", storedLanguage: "fr", searchFields: ALL_FIELDS },
  { querySet: QuerySet.LABELLED_EXPERIENCE, queryLanguage: "fr", storedLanguage: "en", searchFields: ALL_FIELDS },
  { querySet: QuerySet.LABELLED_EXPERIENCE, queryLanguage: "en", storedLanguage: "en", searchFields: ALL_FIELDS },
];
const EVAL_CASES = [...ESCO_ALT_LABEL_CASES, ...(LABELLED_QUERIES_PATH ? LABELLED_CASES : [])];

const describeIfConfigured = EVAL_MONGODB_URI && GEMINI_API_KEY ? describe : describe.skip;

describeIfConfigured("Test the multilingual retrieval of occupations with Atlas Vector Search", () => {
  const embeddingModelServiceFactory = getCachingEmbeddingModelServiceFactory(path.join(WORK_DIR, "cache"));
  const reportedCases: { evalCase: IEvalCase; results: IQueryResult[] }[] = [];
  let dbConnection: Connection;
  let givenModel: IEvalModel;
  let givenQuerySets: Partial<Record<QuerySet, IEvalQuery[]>>;

  beforeAll(
    async () => {
      // GIVEN an empty evaluation database
      dbConnection = await connectToEvalDatabase(EVAL_MONGODB_URI!, GEMINI_API_KEY!);
      // AND an embedding model that can be called (checked first, so that a misconfigured key fails right away)
      await embeddingModelServiceFactory(EMBEDDING_SERVICE_ID).generateEmbedding("preflight check");
      // AND a model of the ESCO occupations in all the model languages
      givenModel = await importESCOOccupationsModel(MODEL_LANGUAGES, path.join(WORK_DIR, "csv"));
      // AND the embeddings of all its entities in all its languages
      await embedModel(givenModel.id, EMBEDDING_SERVICE_ID, embeddingModelServiceFactory);
      // AND the production vector search index over the occupation embeddings
      await createOccupationsVectorSearchIndex(dbConnection);
      // AND the query sets, labelled with occupations of the model
      givenQuerySets = loadQuerySets(givenModel, MODEL_LANGUAGES, LABELLED_QUERIES_PATH);
    },
    2 * 60 * 60 * 1000
  ); // the first run embeds the whole model, the next ones hit the cache

  afterAll(async () => {
    if (!dbConnection) return;
    if (reportedCases.length > 0) {
      writeReport(path.join(WORK_DIR, "reports"), {
        embeddingServiceId: EMBEDDING_SERVICE_ID,
        topK: TOP_K,
        cases: reportedCases,
        storage: await getEmbeddingsStorage(givenModel.id),
      });
    }
    await dbConnection.dropDatabase();
    await dbConnection.close();
  });

  test.each(EVAL_CASES)(
    "should retrieve the occupations of the $querySet queries in $queryLanguage from the $storedLanguage embeddings of $searchFields",
    async (givenCase) => {
      // GIVEN the queries of the case's query set
      const givenQueries = givenQuerySets[givenCase.querySet] ?? [];
      expect(givenQueries.length).toBeGreaterThan(0);

      // WHEN the occupations are searched for every query, in the case's query language,
      // against the stored embeddings of the case's stored language
      const actualResults = await searchQueries(
        givenModel,
        givenCase,
        givenQueries,
        EMBEDDING_SERVICE_ID,
        embeddingModelServiceFactory,
        TOP_K
      );

      // THEN expect every query to retrieve a full page of occupations
      expect(actualResults.filter((result) => result.rankedCodes.length !== TOP_K)).toEqual([]);
      // AND the results of the case to be reported
      reportedCases.push({ evalCase: givenCase, results: actualResults });
    },
    30 * 60 * 1000
  );
});
