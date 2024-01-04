import { ILocalizedOccupation, INewLocalizedOccupationSpec } from "esco/localizedOccupation/localizedOccupation.types";
import { ProcessBatchFunction } from "import/batch/BatchProcessor";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { isSpecified } from "server/isUnspecified";
import errorLogger from "common/errorLogger/errorLogger";

export function getProcessLocalizedOccupationEntityBatchFunction(
  modelId: string,
  repository: {
    createMany: (modelId: string, specs: INewLocalizedOccupationSpec[]) => Promise<ILocalizedOccupation[]>;
  },
  importIdToDBIdMap: Map<string, string>
): ProcessBatchFunction<INewLocalizedOccupationSpec> {
  let totalRowsProcessed = 0;
  return async (specs: INewLocalizedOccupationSpec[]) => {
    const stats: RowsProcessedStats = {
      rowsProcessed: specs.length,
      rowsSuccess: 0,
      rowsFailed: 0,
    };
    try {
      // import only the rows that have a valid importId
      const toImportSpecs = specs.filter((spec) => {
        return isSpecified(spec.importId);
      });

      const entities = await repository.createMany(modelId, toImportSpecs);
      // map the importId to the db id
      // They will be used in a later stage to build the hierarchy and associations
      entities.forEach((entity) => {
        if (isSpecified(entity.importId)) {
          importIdToDBIdMap.set(entity.importId, entity.id);
        }
      });
      stats.rowsSuccess = entities.length;
    } catch (e: unknown) {
      errorLogger.logError(`Failed to process Occupations batch`, e);
    }
    // iterate over the specs and look if the importId is in the map, if it is not then declare that the row has failed
    specs.forEach((spec, index) => {
      if (!importIdToDBIdMap.has(spec.importId)) {
        errorLogger.logWarning(
          `Failed to import Occupation from row:${totalRowsProcessed + index + 1} with importId:${spec.importId}`
        );
      }
    });
    totalRowsProcessed += stats.rowsProcessed;
    stats.rowsFailed = specs.length - stats.rowsSuccess;
    return stats;
  };
}
