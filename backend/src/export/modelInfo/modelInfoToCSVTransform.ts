import { pipeline, Transform } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { Readable } from "node:stream";

const modelInfoHeaders = [
  "UUID",
  "Name",
  "Locale",
  "Description",
  "Version",
  "Released",
  "Previous",
  "ReleaseNotes",
  "OriginURI",
];

interface IModelInfoRow {
  UUID: string;
  Name: string;
  Locale: string;
  Description: string;
  Version: string;
  Released: "TRUE" | "FALSE";
  Previous: string;
  ReleaseNotes: string;
  OriginUUID: string;
}

export const transformModelInfoSpecToCSVRow = (modelInfo: IModelInfo): IModelInfoRow => {
  return {
    UUID: modelInfo.UUID,
    Name: modelInfo.name,
    Locale: modelInfo.locale.shortCode,
    Description: modelInfo.description,
    Version: modelInfo.version,
    Released: modelInfo.released ? "TRUE" : "FALSE",
    Previous: modelInfo.previousUUID,
    ReleaseNotes: modelInfo.releaseNotes,
    OriginUUID: modelInfo.originUUID,
  };
};

class ModelInfoToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    modelInfo: IModelInfo,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformModelInfoSpecToCSVRow(modelInfo);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(modelInfo, null, 2);
      } finally {
        const error = new Error(`Failed to transform ModelInfo to CSV row: ${json}`);
        console.error(error, cause);
        callback(error);
      }
    }
  }
}

const ModelInfoToCSVTransform = async (modelId: string): Promise<Readable> => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const modelInfoStringifier = stringify({
    header: true,
    columns: modelInfoHeaders,
  });
  const modelInfo = await getRepositoryRegistry().modelInfo.getModelById(modelId);

  if (!modelInfo) {
    throw new Error("ModelInfo not found");
  }
  return pipeline(Readable.from([modelInfo]), new ModelInfoToCSVRowTransformer(), modelInfoStringifier, (cause) => {
    if (cause) {
      console.error(new Error("Transforming ModelInfo to CSV failed"), cause);
    }
  });
};

export default ModelInfoToCSVTransform;
