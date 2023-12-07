import { pipeline, Transform } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { stringify } from "csv-stringify";
import { ILocalizedOccupation } from "esco/localizedOccupation/localizedOccupation.types";
import { ILocalizedOccupationRow, localizedOccupationHeaders } from "esco/common/entityToCSV.types";
import { Readable } from "node:stream";

export type IUnpopulatedLocalizedOccupation = Omit<
  ILocalizedOccupation,
  "parent" | "children" | "requiresSkills" | "localizesOccupation"
> & { localizesOccupationId: string };

export const transformLocalizedOccupationSpecToCSVRow = (
  localizedOccupation: IUnpopulatedLocalizedOccupation
): ILocalizedOccupationRow => {
  return {
    ID: localizedOccupation.id,
    ALTLABELS: localizedOccupation.altLabels.length ? localizedOccupation.altLabels.join("\n") : "",
    DESCRIPTION: localizedOccupation.description,
    OCCUPATIONTYPE: localizedOccupation.occupationType,
    LOCALIZESOCCUPATIONID: localizedOccupation.localizesOccupationId,
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
        const error = new Error(`Failed to transform LocalizedOccupation to CSV row: ${json}`);
        console.error(error, cause);
        callback(error);
      }
    }
  }
}

const LocalizedOccupationsToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const localizedOccupationStringifier = stringify({
    header: true,
    columns: localizedOccupationHeaders,
  });

  return pipeline(
    getRepositoryRegistry().localizedOccupation.findAll(modelId),
    new LocalizedOccupationToCSVRowTransformer(),
    localizedOccupationStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming LocalizedOccupations to CSV failed"), cause);
      }
    }
  );
};

export default LocalizedOccupationsToCSVTransform;
