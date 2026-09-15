import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { getMockId } from "src/_test_utilities/mockMongoId";
import { IMPORT_PROCESS_STATUS } from "src/api-types";

export const getAllImportProcessStatePermutations = (): ModelInfoTypes.ImportProcessState[] => {
  // generate all permutations of ImportProcessState status, errored, parsingErrors, parsingWarnings
  const allStatuses = Object.values(IMPORT_PROCESS_STATUS);
  const allBooleans = [true, false];

  const allPermutations: ModelInfoTypes.ImportProcessState[] = [];
  allStatuses.forEach((status) => {
    allBooleans.forEach((errored) => {
      allBooleans.forEach((parsingErrors) => {
        allBooleans.forEach((parsingWarnings) => {
          allPermutations.push({
            id: getMockId(allPermutations.length + 1),
            status,
            result: {
              errored,
              parsingErrors: parsingErrors,
              parsingWarnings: parsingWarnings,
            },
            createdAt: new Date(allPermutations.length),
            updatedAt: new Date(allPermutations.length),
          });
        });
      });
    });
  });
  return allPermutations;
};
