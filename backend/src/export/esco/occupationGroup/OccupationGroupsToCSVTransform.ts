import {IOccupationGroup} from "esco/occupationGroup/OccupationGroup.types";
import {IOccupationGroupExportRow, OccupationGroupExportHeaders} from "esco/common/entityToCSV.types";
import {pipeline, Readable, Transform} from "stream";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegistry";
import {stringify} from "csv-stringify";
import {stringFromArray} from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import {CSVObjectTypes, getCSVTypeFromObjectType} from "esco/common/csvObjectTypes";

export type IUnpopulatedOccupationGroup = Omit<IOccupationGroup, "parent" | "children">;

export const transformOccupationGroupSpecToCSVRow = (
  occupationGroup: IUnpopulatedOccupationGroup
): IOccupationGroupExportRow => {
  const GROUPTYPE = getCSVTypeFromObjectType(occupationGroup.groupType);
  if(GROUPTYPE !== CSVObjectTypes.ISCOGroup && GROUPTYPE !== CSVObjectTypes.LocalGroup) {
    throw new Error(`Failed to transform OccupationGroup to CSV row: Invalid groupType: ${occupationGroup.groupType}`);
  }
  return {
    ORIGINURI: occupationGroup.originUri,
    ID: occupationGroup.id,
    UUIDHISTORY: stringFromArray(occupationGroup.UUIDHistory),
    CODE: occupationGroup.code,
    GROUPTYPE: GROUPTYPE,
    PREFERREDLABEL: occupationGroup.preferredLabel,
    ALTLABELS: stringFromArray(occupationGroup.altLabels),
    DESCRIPTION: occupationGroup.description,
    CREATEDAT: occupationGroup.createdAt.toISOString(),
    UPDATEDAT: occupationGroup.updatedAt.toISOString(),
  };
};

class OccupationGroupToCSVRowTransformer extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    occupationGroup: IUnpopulatedOccupationGroup,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: never) => void
  ): void {
    try {
      const transformedRow = transformOccupationGroupSpecToCSVRow(occupationGroup);
      this.push(transformedRow);
      callback();
    } catch (cause: unknown) {
      // Make sure stringification doesn't fail, otherwise throwing an error will cause the stream to hang
      let json: string = "";
      try {
        json = JSON.stringify(occupationGroup, null, 2);
      } finally {
        const err = new Error(`Failed to transform OccupationGroup to CSV row: ${json}`, { cause: cause });
        console.error(err);
        callback(err);
      }
    }
  }
}

const OccupationGroupsToCSVTransform = (modelId: string): Readable => {
  // the stringify is a stream, and we need a new one every time we create a new pipeline
  const occupationGroupStringifier = stringify({
    header: true,
    columns: OccupationGroupExportHeaders,
    quoted_string: true,
  });

  return pipeline(
    getRepositoryRegistry().OccupationGroup.findAll(modelId),
    new OccupationGroupToCSVRowTransformer(),
    occupationGroupStringifier,
    (cause) => {
      if (cause) {
        console.error(new Error("Transforming ESCO occupationGroups to CSV failed", { cause: cause }));
      }
    }
  );
};

export default OccupationGroupsToCSVTransform;
