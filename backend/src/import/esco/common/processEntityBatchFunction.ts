import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { isSpecified } from "server/isUnspecified";
import errorLogger from "common/errorLogger/errorLogger";
import { ProcessBatchFunction } from "import/batch/BatchProcessor";
import { ImportIdentifiable } from "esco/common/objectTypes";

export function getProcessEntityBatchFunction<
  EntityType extends ImportIdentifiable & { id: string },
  SpecificationType extends ImportIdentifiable,
>(
  entityName: string,
  repository: {
    createMany: (specs: SpecificationType[]) => Promise<EntityType[]>;
  },
  importIdToDBIdMap: Map<string, string>
): ProcessBatchFunction<SpecificationType> {
  let totalRowsProcessed = 0;
  return async (specs: SpecificationType[]) => {
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

      const entities = await repository.createMany(toImportSpecs);
      // map the importId to the db id
      // They will be used in a later stage to build the hierarchy and associations
      entities.forEach((entity) => {
        if (isSpecified(entity.importId)) {
          importIdToDBIdMap.set(entity.importId, entity.id);
        }
      });
      stats.rowsSuccess = entities.length;
    } catch (e: unknown) {
      errorLogger.logError(`Failed to process ${entityName}s batch`, e);
    }
    // iterate over the specs and look if the importId is in the map, if it is not then declare that the row has failed
    specs.forEach((spec, index) => {
      if (!importIdToDBIdMap.has(spec.importId)) {
        errorLogger.logWarning(
          `Failed to import ${entityName} from row:${totalRowsProcessed + index + 1} with importId:${spec.importId}`
        );
      }
    });
    totalRowsProcessed += stats.rowsProcessed;
    stats.rowsFailed = specs.length - stats.rowsSuccess;
    return stats;
  };
}
