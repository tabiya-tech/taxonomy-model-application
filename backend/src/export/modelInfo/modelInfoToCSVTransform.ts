import { pipeline, Transform } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { Readable } from "node:stream";

const modelInfoHeaders = [
  "UUIDHistory",
  "NAME",
  "LOCALE",
  "DESCRIPTION",
  "VERSION",
  "RELEASED",
  "RELEASENOTES",
  "CREATEDAT",
  "UPDATEDAT",
];

interface IModelInfoRow {
  UUIDHistory: string;
  NAME: string;
  LOCALE: string;
  DESCRIPTION: string;
  VERSION: string;
  RELEASED: "TRUE" | "FALSE";
  RELEASENOTES: string;
  CREATEDAT: string;
  UPDATEDAT: string;
}

export const transformModelInfoSpecToCSVRow = (modelInfo: IModelInfo): IModelInfoRow => {
  return {
    UUIDHistory: modelInfo.UUIDHistory.join("\n"),
    NAME: modelInfo.name,
    LOCALE: modelInfo.locale.shortCode,
    DESCRIPTION: modelInfo.description,
    VERSION: modelInfo.version,
    RELEASED: modelInfo.released ? "TRUE" : "FALSE",
    RELEASENOTES: modelInfo.releaseNotes,
    CREATEDAT: modelInfo.createdAt.toISOString(),
    UPDATEDAT: modelInfo.updatedAt.toISOString(),
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
        const err = new Error(`Failed to transform ModelInfo to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

const ModelInfoToCSVTransform = async (modelId: string): Promise<Readable> => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const modelInfoStringifier = stringify({
    header: true,
    columns: modelInfoHeaders,
    quoted_string: true,
  });
  const modelInfo = await getRepositoryRegistry().modelInfo.getModelById(modelId);

  if (!modelInfo) {
    throw new Error("ModelInfo not found");
  }
  return pipeline(Readable.from([modelInfo]), new ModelInfoToCSVRowTransformer(), modelInfoStringifier, (cause) => {
    if (cause) {
      console.error(new Error("Transforming ModelInfo to CSV failed", { cause: cause }));
    }
  });
};

export default ModelInfoToCSVTransform;
