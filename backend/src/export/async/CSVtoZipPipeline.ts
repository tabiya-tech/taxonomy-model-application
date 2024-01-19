import { pipeline, Readable } from "stream";
import { ObjectCounterTransform } from "export/common/objectCounterTransform";
import { Archiver } from "archiver";
import errorLogger from "common/errorLogger/errorLogger";

const CSVtoZipPipeline = (
  pipelineName: string,
  csvFileName: string,
  csvStream: Readable,
  zipper: Archiver,
  notifyOnFinish: (error?: Error) => void
): Readable => {
  const objectCounterTransform = new ObjectCounterTransform();
  const csvPipeline = pipeline(csvStream, objectCounterTransform, (cause) => {
    if (cause) {
      const error = new Error(`An error occurred while reading the ${pipelineName} CSV data.`, { cause: cause });
      errorLogger.logError(error);
      // We should notify the caller of the error, so that it can manually close the download stream as the zipper does not handle the streams
      notifyOnFinish(error); // This is where we notify the caller that the pipeline has finished
    } else {
      console.info(
        `Zipping CSV file ${csvFileName} succeeded. ${objectCounterTransform.getObjectCount()} objects processed.`
      );
      notifyOnFinish();
    }
  });

  zipper.append(csvPipeline, { name: csvFileName });
  return csvPipeline;
};

export default CSVtoZipPipeline;
