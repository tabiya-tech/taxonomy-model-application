import { IISCOGroup } from "esco/iscoGroup/ISCOGroup.types";
import { IISCOGroupRow, ISCOGroupHeaders } from "esco/common/entityToCSV.types";
import { pipeline, Readable, Transform } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";

export type IUnpopulatedISCOGroup = Omit<IISCOGroup, "parent" | "children">;

export const transformISCOGroupSpecToCSVRow = (iscoGroup: IUnpopulatedISCOGroup): IISCOGroupRow => {
  return {
    ESCOURI: iscoGroup.ESCOUri,
    ID: iscoGroup.id,
    UUIDHISTORY: iscoGroup.UUIDHistory.join("\n"),
    CODE: iscoGroup.code,
    PREFERREDLABEL: iscoGroup.preferredLabel,
    ALTLABELS: iscoGroup.altLabels.join("\n"),
    DESCRIPTION: iscoGroup.description,
  };
};

class ISCOGroupToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    iscoGroup: IUnpopulatedISCOGroup,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformISCOGroupSpecToCSVRow(iscoGroup);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(iscoGroup, null, 2);
      } finally {
        const error = new Error(`Failed to transform ISCOGroup to CSV row: ${json}`);
        console.error(error, cause);
        callback(error);
      }
    }
  }
}

const ISCOGroupsToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const iscoGroupStringifier = stringify({
    header: true,
    columns: ISCOGroupHeaders,
  });

  return pipeline(
    getRepositoryRegistry().ISCOGroup.findAll(modelId),
    new ISCOGroupToCSVRowTransformer(),
    iscoGroupStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming ESCO iscoGroups to CSV failed"), cause);
      }
    }
  );
};

export default ISCOGroupsToCSVTransform;
