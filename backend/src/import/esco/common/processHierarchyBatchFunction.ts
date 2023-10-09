import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import importLogger from "import/importLogger/importLogger";

export function getProcessHierarchyBatchFunction<HierarchyType extends { id: string }, SpecificationType>(
  modelId: string,
  hierarchyName: string,
  repository: {
    createMany: (modelId: string, specs: SpecificationType[]) => Promise<HierarchyType[]>;
  }
) {
  return async (specs: SpecificationType[]) => {
    const stats: RowsProcessedStats = {
      rowsProcessed: specs.length,
      rowsSuccess: 0,
      rowsFailed: 0,
    };

    try {
      const hierarchyEntries = await repository.createMany(modelId, specs);
      stats.rowsSuccess = hierarchyEntries.length;
    } catch (e: unknown) {
      importLogger.logError(`Failed to process ${hierarchyName}s batch`, e);
    }
    stats.rowsFailed = specs.length - stats.rowsSuccess;
    // Hierarchies should also have an import id to be able to identify the rows in case the row could not be imported.
    //  Currently, we cannot log any warnings as we do not know which row is causing the issue.
    if (stats.rowsFailed > 0) {
      importLogger.logWarning(
        `${stats.rowsFailed} of the ${hierarchyName} entries could not be imported. Currently no further information is available.`
      );
    }
    return stats;
  };
}
