import https from "https";
import {IncomingMessage} from "http";
import {parse, Parser} from "csv-parse";
import {Readable} from "node:stream";
import {RowProcessor} from "import/parse/RowProcessor.types";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";


export function processDownloadStream<T>(url: string, rowProcessor: RowProcessor<T>): Promise<RowsProcessedStats> {
  return new Promise<RowsProcessedStats>((resolve, reject) => {
    const request = https.get(url, async (response: IncomingMessage) => {
      try {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file ${url}. Status Code: ${response.statusCode}`));
          return;
        }
       const stats =  await processStream<T>(response, rowProcessor);
        resolve(stats);
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

export function processStream<T>(stream: Readable, rowProcessor: RowProcessor<T>): Promise<RowsProcessedStats> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<RowsProcessedStats>(async (resolve, reject) => {
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
          const headersValidated = await rowProcessor.validateHeaders(Object.keys(record));
          if(!headersValidated){
            const e = new Error(`Invalid headers: ${Object.keys(record)}`);
            console.error(e);
            reject(e);
            return;
          }
        }
        count++;
        await rowProcessor.processRow(record, count);
      }
      const stats  = await rowProcessor.completed();
      resolve(stats);
    } catch (e: unknown) {
      console.error("Error while processing the stream:", e);
      reject(e);
    }
  });
}