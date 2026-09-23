import https from "https";
import { Agent as HttpsAgent } from "https";
import { IncomingMessage } from "http";
import { Readable } from "node:stream";
import { parse } from "csv-parse";
import { StatusCodes } from "server/httpUtils";

/**
 * Reads the header row of a CSV stream.
 *
 * Only the first line is parsed, the rest of the stream is discarded. The headers are converted to uppercase, the same
 * way processStream() converts them, so that they can be compared to the headers the parsers expect.
 *
 * @param stream the CSV stream to read the headers of
 * @returns the headers in uppercase, or an empty list when the stream is empty
 */
export async function readCSVHeaders(stream: Readable): Promise<string[]> {
  const parser = stream.pipe(parse({ to_line: 1 }));
  try {
    for await (const record of parser) {
      return (record as string[]).map((header) => header.toUpperCase());
    }
    return [];
  } finally {
    // stop reading, only the first line is needed
    stream.destroy();
  }
}

/**
 * Downloads the header row of the CSV file at the given URL.
 *
 * @param url the URL of the CSV file
 * @returns the headers in uppercase
 * @throws an error when the file cannot be downloaded or parsed
 */
export function readCSVHeadersFromUrl(url: string): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    // Use a new agent to avoid issues with stale connections
    // that may cause a ECONNRESET error
    const agent = new HttpsAgent({ keepAlive: false });
    const request = https.get(url, { agent }, (response: IncomingMessage) => {
      if (response.statusCode !== StatusCodes.OK) {
        response.destroy();
        reject(new Error(`Failed to download the headers of the file ${url}. Status Code: ${response.statusCode}`));
        return;
      }
      readCSVHeaders(response).then(resolve, (e: unknown) => {
        reject(new Error(`Failed to read the headers of the file ${url}`, { cause: e }));
      });
    });
    request.on("error", (e: Error) => {
      reject(new Error(`Failed to download the headers of the file ${url}`, { cause: e }));
    });
  });
}
