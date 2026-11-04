import fs from "fs";
import path from "path";
import EmbeddingsAPISpecs from "api-specifications/embeddings";
import {
  ICaseMetrics,
  IEmbeddingsStorage,
  IEvalCase,
  IQueryResult,
  IRetrievalMetrics,
} from "./multilingualEmbeddings.types";

const METRICS_KS = [1, 5, 10];

// e.g. 2411 for 2411.1
function getISCOUnitGroup(code: string): string {
  return code.split(".")[0];
}

function computeRetrievalMetrics(
  results: IQueryResult[],
  isMatch: (retrievedCode: string, goldCode: string) => boolean
): IRetrievalMetrics {
  const ranks = results.map((result) => result.rankedCodes.findIndex((code) => isMatch(code, result.goldCode)) + 1);
  const share = (count: number) => (results.length === 0 ? 0 : count / results.length);
  return {
    hitAt: Object.fromEntries(METRICS_KS.map((k) => [k, share(ranks.filter((rank) => rank > 0 && rank <= k).length)])),
    mrr: share(ranks.reduce((sum, rank) => sum + (rank > 0 ? 1 / rank : 0), 0)),
  };
}

function computeCaseMetrics(results: IQueryResult[]): ICaseMetrics {
  return {
    queries: results.length,
    strict: computeRetrievalMetrics(results, (code, goldCode) => code === goldCode),
    lenient: computeRetrievalMetrics(
      results,
      (code, goldCode) => getISCOUnitGroup(code) === getISCOUnitGroup(goldCode)
    ),
  };
}

function getCaseName(evalCase: IEvalCase): string {
  return `${evalCase.querySet}: query ${evalCase.queryLanguage}, stored ${
    evalCase.storedLanguage
  }, fields ${evalCase.searchFields.join(",")}`;
}

/**
 * Writes summary.md, summary.json and results.jsonl (every query's results, for further analysis) to a new folder.
 */
export function writeReport(
  reportsFolder: string,
  run: {
    embeddingServiceId: string;
    topK: number;
    cases: { evalCase: IEvalCase; results: IQueryResult[] }[];
    storage: IEmbeddingsStorage;
  }
): void {
  const embeddingService = EmbeddingsAPISpecs.Constants.EmbeddingServices.find(
    (service) => service.id === run.embeddingServiceId
  );
  const cases = run.cases.map(({ evalCase, results }) => ({
    name: getCaseName(evalCase),
    evalCase,
    metrics: computeCaseMetrics(results),
    results,
  }));

  const pct = (value: number) => (value * 100).toFixed(1);
  const summary = [
    `# Multilingual occupation retrieval`,
    ``,
    `Embedding model: ${embeddingService?.modelName} (${embeddingService?.numberOfDimensions} dimensions), top ${run.topK}.`,
    ``,
    `| Case | Queries | Strict hit@1 | hit@5 | hit@10 | MRR | Lenient hit@1 | hit@5 | hit@10 | MRR |`,
    `|---|---|---|---|---|---|---|---|---|---|`,
    ...cases.map(({ name, metrics: { queries, strict, lenient } }) => {
      const columns = [strict, lenient].flatMap((m) => [...METRICS_KS.map((k) => pct(m.hitAt[k])), m.mrr.toFixed(3)]);
      return `| ${[name, queries, ...columns].join(" | ")} |`;
    }),
    ``,
    `Strict: the gold occupation is retrieved. Lenient: an occupation of its ISCO unit group is retrieved.`,
    ``,
    `| Stored language | Embedding documents | Bytes |`,
    `|---|---|---|`,
    ...Object.entries(run.storage).map(
      ([language, { documents, bytes }]) => `| ${language} | ${documents} | ${bytes} |`
    ),
  ].join("\n");

  const reportFolder = path.join(reportsFolder, new Date().toISOString().replace(/[:.]/g, "-"));
  fs.mkdirSync(reportFolder, { recursive: true });
  fs.writeFileSync(path.join(reportFolder, "summary.md"), summary);
  fs.writeFileSync(
    path.join(reportFolder, "summary.json"),
    JSON.stringify(
      {
        embeddingService,
        topK: run.topK,
        storage: run.storage,
        cases: cases.map(({ name, evalCase, metrics }) => ({ name, ...evalCase, metrics })),
      },
      null,
      2
    )
  );
  fs.writeFileSync(
    path.join(reportFolder, "results.jsonl"),
    cases.flatMap(({ name, results }) => results.map((result) => JSON.stringify({ case: name, ...result }))).join("\n")
  );
  // the console is muted by the console mock
  process.stdout.write(`\n${summary}\n\nReport written to ${reportFolder}\n`);
}
