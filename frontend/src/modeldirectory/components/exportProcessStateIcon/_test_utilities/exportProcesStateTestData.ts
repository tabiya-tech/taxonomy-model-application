import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import ExportProcessStateAPISpecs from "api-specifications/importProcessState";
import { getMockId } from "src/_test_utilities/mockMongoId";

export const getAllExportProcessStatePermutations = (): ModelInfoTypes.ExportProcessState[] => {
  // generate all permutations of ExportProcessState status, errored, exportErrors, exportWarnings
  const allStatuses = Object.values(ExportProcessStateAPISpecs.Enums.Status); // Assuming it's an enum with string values
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
            timestamp: new Date(),
          });
        });
      });
    });
  });
  return allPermutations;
};
