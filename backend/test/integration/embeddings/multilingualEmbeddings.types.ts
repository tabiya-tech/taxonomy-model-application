import { EmbeddableField } from "embeddings/service/types";

export enum QuerySet {
  // An ESCO alt label of the occupation that paraphrases its preferred label.
  ESCO_ALT_LABEL = "esco-altLabel",
  // The title of a job ad labelled with the occupation.
  LABELLED_TITLE = "labelled-title",
  // A first person description of the experience a job ad labelled with the occupation asks for.
  LABELLED_EXPERIENCE = "labelled-experience",
}

export interface IEvalCase {
  querySet: QuerySet;
  queryLanguage: string;
  // The language of the stored embeddings the queries are searched against.
  storedLanguage: string;
  searchFields: EmbeddableField[];
}

export interface IEvalQuery {
  id: string;
  // The ESCO code of the occupation the query is labelled with.
  goldCode: string;
  // By language dbKeyName.
  text: Partial<Record<string, string>>;
}

export interface IQueryResult {
  queryId: string;
  queryText: string;
  goldCode: string;
  // Best first.
  rankedCodes: string[];
  scores: number[];
}

export interface IEvalModel {
  id: string;
  codeByOccupationId: Map<string, string>;
}

export interface IRetrievalMetrics {
  // The share of the queries whose gold occupation is in the first k results, by k.
  hitAt: Record<number, number>;
  mrr: number;
}

export interface ICaseMetrics {
  queries: number;
  // The retrieved occupation is the gold one.
  strict: IRetrievalMetrics;
  // The retrieved occupation is in the gold one's ISCO unit group, e.g. 2411.1 and 2411.3.
  lenient: IRetrievalMetrics;
}

// By language dbKeyName.
export type IEmbeddingsStorage = Record<string, { documents: number; bytes: number }>;
