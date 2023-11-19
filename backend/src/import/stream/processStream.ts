import https from "https";
import { IncomingMessage } from "http";
import { parse, Parser } from "csv-parse";
import { Readable } from "node:stream";
import { RowProcessor } from "import/parse/RowProcessor.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";

export function processDownloadStream<T>(
  url: string,
  streamName: string,
  rowProcessor: RowProcessor<T>
): Promise<RowsProcessedStats> {
  return new Promise<RowsProcessedStats>((resolve, reject) => {
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
          const stats = await processStream<T>(streamName, response, rowProcessor);
          resolve(stats);
        } catch (e: unknown) {
          errorLogger.logError(`Error while processing ${url} for ${streamName}`, e);
          reject(e);
        }
      })();
    });
    request.on("error", (error: Error) => {
      errorLogger.logError(`Failed to download file ${url} for ${streamName}`, error);
      reject(error);
    });
  });
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
          errorLogger.logError(`Error from the reading the stream:${streamName}`, error);
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
        // parser.on('error', (error: Error) => {
        //  console.error(`Error from the csv parser:`, error);
        //  reject(error);
        // });

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
        errorLogger.logError(`Error while processing the stream:${streamName}`, e);
        reject(e);
      }
    })();
  });
}
