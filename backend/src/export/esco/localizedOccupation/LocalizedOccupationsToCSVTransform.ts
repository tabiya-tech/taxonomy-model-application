import { pipeline, Transform } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { ILocalizedOccupation } from "esco/localizedOccupation/localizedOccupation.types";
import { ILocalizedOccupationExportRow, localizedOccupationExportHeaders } from "esco/common/entityToCSV.types";
import { Readable } from "node:stream";

export type IUnpopulatedLocalizedOccupation = Omit<
  ILocalizedOccupation,
  "parent" | "children" | "requiresSkills" | "localizesOccupation"
> & { localizesOccupationId: string };

export const transformLocalizedOccupationSpecToCSVRow = (
  localizedOccupation: IUnpopulatedLocalizedOccupation
): ILocalizedOccupationExportRow => {
  return {
    ID: localizedOccupation.id,
    UUIDHISTORY: localizedOccupation.UUIDHistory.join("\n"),
    ALTLABELS: localizedOccupation.altLabels.join("\n"),
    DESCRIPTION: localizedOccupation.description,
    OCCUPATIONTYPE: localizedOccupation.occupationType,
    LOCALIZESOCCUPATIONID: localizedOccupation.localizesOccupationId,
    CREATEDAT: localizedOccupation.createdAt.toISOString(),
    UPDATEDAT: localizedOccupation.updatedAt.toISOString(),
  };
};

class LocalizedOccupationToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    localizedOccupation: IUnpopulatedLocalizedOccupation,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformLocalizedOccupationSpecToCSVRow(localizedOccupation);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(localizedOccupation, null, 2);
      } finally {
        const err = new Error(`Failed to transform LocalizedOccupation to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

const LocalizedOccupationsToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const localizedOccupationStringifier = stringify({
    header: true,
    columns: localizedOccupationExportHeaders,
  });

  return pipeline(
    getRepositoryRegistry().localizedOccupation.findAll(modelId),
    new LocalizedOccupationToCSVRowTransformer(),
    localizedOccupationStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming LocalizedOccupations to CSV failed", { cause: cause }));
      }
    }
  );
};

export default LocalizedOccupationsToCSVTransform;
