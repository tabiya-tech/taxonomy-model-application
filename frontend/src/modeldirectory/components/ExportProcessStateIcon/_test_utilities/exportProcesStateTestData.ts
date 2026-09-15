import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { getMockId } from "src/_test_utilities/mockMongoId";
import { EXPORT_PROCESS_STATUS } from "src/api-types";

export const getAllExportProcessStatePermutations = (): ModelInfoTypes.ExportProcessState[] => {
  // generate all permutations of ExportProcessState status, errored, exportErrors, exportWarnings
  const allStatuses = Object.values(EXPORT_PROCESS_STATUS);
  const allBooleans = [true, false];

  const allPermutations: ModelInfoTypes.ExportProcessState[] = [];
  allStatuses.forEach((status) => {
    allBooleans.forEach((errored) => {
      allBooleans.forEach((exportErrors) => {
        allBooleans.forEach((exportWarnings) => {
          allPermutations.push({
            id: getMockId(allPermutations.length + 1),
            status,
            result: {
              errored,
              exportErrors: exportErrors,
              exportWarnings: exportWarnings,
            },
            downloadUrl: "https://example.com",
            timestamp: new Date(allPermutations.length),
            createdAt: new Date(allPermutations.length),
            updatedAt: new Date(allPermutations.length),
          });
        });
      });
    });
  });
  return allPermutations;
};
