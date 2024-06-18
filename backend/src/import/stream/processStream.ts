import https from "https";
import { IncomingMessage } from "http";
import { parse, Parser } from "csv-parse";
import { Readable } from "node:stream";
import { RowProcessor } from "import/parse/RowProcessor.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processDownloadStream<T>(
  url: string,
  streamName: string,
  rowProcessor: RowProcessor<T>,
  retries = MAX_RETRIES
): Promise<RowsProcessedStats> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const stats = await new Promise<RowsProcessedStats>((resolve, reject) => {
        const request = https.get(url, (response: IncomingMessage) => {
          (async () => {
            try {
              if (response.statusCode !== 200) {
                const e = new Error(
                  `Failed to download file ${url} for ${streamName}. Status Code: ${response.statusCode}`
                );
                errorLogger.logError(e);
                reject(e);
                return;
              }
              console.info(`Downloading file ${url} for ${streamName}...`);
              const stats = await processStream<T>(streamName, response, rowProcessor);
              resolve(stats);
            } catch (e: unknown) {
              const err = new Error(`Error while processing ${url} for ${streamName}`, { cause: e });
              errorLogger.logError(err);
              reject(err);
            }
          })();
        });

        request.on("error", (e: Error) => {
          const err = new Error(`Failed to download file ${url} for ${streamName}`, { cause: e });
          errorLogger.logError(err);
          throw err;
        });
      });

      return stats;
    } catch (error) {
      errorLogger.logError(new Error(`Attempt ${attempt} failed`, { cause: error }));

      if (attempt < retries) {
        console.warn(`Retrying download... Attempt ${attempt + 1}`);
        await sleep(RETRY_DELAY_MS);
      } else {
        const err = new Error(`Failed to download file ${url} after ${retries} attempts, for stream ${streamName}`, {
          cause: error,
        });
        throw err;
      }
    }
  }
  // This will never be reached due to the loop structure
  throw new Error("Unexpected error in processDownloadStream");
}

export function processStream<T>(
  streamName: string,
  stream: Readable,
  rowProcessor: RowProcessor<T>
): Promise<RowsProcessedStats> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<RowsProcessedStats>((resolve, reject) => {
    (async () => {
      try {
        stream.on("error", (error: Error) => {
          const err = new Error(`Error from the reading the stream: ${streamName}`, { cause: error });
          errorLogger.logError(err);
          reject(error);
        });

        const parser: Parser = stream.pipe(
          parse({
            // Convert the header to uppercase, to avoid case sensitivity issues
            columns: (header) => header.map((column: string) => column.toUpperCase()),
          })
        );

        // Handling error here is not necessary as it is handled by the catch() in the async loop bellow
        // In fact, as the promise is already rejected in the catch() bellow, whoever is waiting for the promise has already been notified
        // and calling reject again here would result in unexpected side effects
        parser.on("error", (error: Error) => {
          console.error(`Error from the csv parser:`, { cause: error });
          // reject(error);
        });

        let count = 0;
        for await (const record of parser) {
          if (count === 0) {
            const headersValidated = await rowProcessor.validateHeaders(Object.keys(record));
            if (!headersValidated) {
              const e = new Error(`Invalid headers:${Object.keys(record)} in stream:${streamName}`);
              errorLogger.logError(e);
              resolve({ rowsProcessed: 0, rowsFailed: 0, rowsSuccess: 0 });
              return; // stop processing the stream as it is unclear what the csv contains
            }
          }
          count++;
          await rowProcessor.processRow(record, count);
        }
        const stats = await rowProcessor.completed();
        resolve(stats);
      } catch (e: unknown) {
        const error = new Error(`Error while processing the stream: ${streamName}`, { cause: e });
        errorLogger.logError(error);
        reject(error);
      }
    })();
  });
}
