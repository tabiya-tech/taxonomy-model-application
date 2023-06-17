import https from "https";
import {IncomingMessage} from "http";
import {parse, Parser} from "csv-parse";
import {Readable} from "node:stream";
import {RowProcessor} from "import/parse/RowProcessor.types";


export function processDownloadStream<T>(url: string, rowProcessor: RowProcessor<T>): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    const request = https.get(url, async (response: IncomingMessage) => {
      try {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file ${url}. Status Code: ${response.statusCode}`));
          return;
        }
        await processStream<T>(response, rowProcessor);
        resolve(true);
      } catch (e: unknown) {
        console.error(`Error while processing  ${url}`, e);
        reject(e);
      }
    });
    request.on('error', (error: Error) => {
      console.error(`Failed to download file ${url}`, error);
      reject(error);
    });
  });
}

export function processStream<T>(stream: Readable, rowProcessor: RowProcessor<T>): Promise<void> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<void>(async (resolve, reject) => {
    try {
      stream.on('error', (error: Error) => {
        console.error(`Error from the reading stream:`, error);
        reject(error);
      });
      const parser: Parser = stream.pipe(parse({
        // Convert the header to uppercase, to avoid case sensitivity issues
        columns: header => header.map((column: string) => column.toUpperCase())
      }));
      parser.on('error', (error: Error) => {
        console.error(`Error from the csv parser:`, error);
        reject(error);
      });
      let count = 0;
      for await (const record of parser) {
        if(count === 0){
          await rowProcessor.validateHeaders(Object.keys(record));
        }
        count++;
        await rowProcessor.processRow(record, count);
      }
      await rowProcessor.completed();
      resolve();
    } catch (e: unknown) {
      console.error("Error while processing the stream:", e);
      reject(e);
    }
  });
}