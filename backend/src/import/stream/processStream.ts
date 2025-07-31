import https from "https";
import { Agent as HttpsAgent } from "https";
import { IncomingMessage } from "http";
import { parse, Parser } from "csv-parse";
import { Readable } from "node:stream";
import { RowProcessor } from "import/parse/RowProcessor.types";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import errorLogger from "common/errorLogger/errorLogger";
import { StatusCodes } from "server/httpUtils";

/**
 * Attempts to check if the first chunk of the file at the given URL can be downloaded.
 * This is done by sending a HEAD request with a Range header to request the first 1024 bytes.
 * If the server responds with a 206 Partial Content or 200 OK status code, it is considered healthy.
 * Retries up to maxAttempts times before failing.
 * @param url
 */
async function checkFirstChunk(url: string): Promise<void> {
  const timeoutMs = 5000;
  const maxAttempts = 5;
  const delayMs = 2000;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Use a new agent to avoid issues with stale connections
      // that may cause a ECONNRESET error
      const agent = new HttpsAgent({ keepAlive: false });
      await new Promise<void>((resolve, reject) => {
        const req = https.request(
          url,
          {
            method: "GET",
            agent,
            headers: { Range: "bytes=0-1023" },
            timeout: timeoutMs,
          },
          (resp) => {
            resp.resume();
            if (resp.statusCode === StatusCodes.PARTIAL_CONTENT || resp.statusCode === 200) {
              console.info(`Health check passed for ${url} on attempt ${attempt}`);
              resolve();
            } else {
              reject(new Error(`Range check failed: status ${resp.statusCode}`));
            }
          }
        );
        req.on("timeout", () => req.destroy(new Error("Timeout during health check")));
        req.on("error", reject);
        req.end();
      });
      return;
    } catch (e) {
      lastError = e;
      console.warn(new Error(`Health check attempt ${attempt} failed for ${url}`, { cause: e }));
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  const err = new Error(`All ${maxAttempts} health-check attempts failed for ${url}`, { cause: lastError });
  errorLogger.logError(err);
  throw err;
}

/**
 * Processes a download stream from the given URL, checking its health first.
 * If the health check passes, proceeds to stream processing.
 * @param url
 * @param streamName
 * @param rowProcessor
 */
export async function processDownloadStream<T>(
  url: string,
  streamName: string,
  rowProcessor: RowProcessor<T>
): Promise<RowsProcessedStats> {
  await checkFirstChunk(url);
  return await safeStreamWithRetry<T>(url, streamName, rowProcessor);
}

async function safeStreamWithRetry<T>(
  url: string,
  streamName: string,
  rowProcessor: RowProcessor<T>
): Promise<RowsProcessedStats> {
  return new Promise<RowsProcessedStats>((resolve, reject) => {
    // Use a new agent to avoid issues with stale connections
    // that may cause a ECONNRESET error
    const agent = new HttpsAgent({ keepAlive: false });
    const request = https.get(url, { agent }, (response: IncomingMessage) => {
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
      reject(err);
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
