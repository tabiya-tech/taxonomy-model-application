import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { getMockId } from "src/_test_utilities/mockMongoId";

export const getAllImportProcessStatePermutations = (): ModelInfoTypes.ImportProcessState[] => {
  // generate all permutations of ImportProcessState status, errored, parsingErrors, parsingWarnings
  const allStatuses = Object.values(ImportProcessStateAPISpecs.Enums.Status); // Assuming it's an enum with string values
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
