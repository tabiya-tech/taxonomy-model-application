// mute the console
import "src/_test_utilities/consoleMock";

import { hasActiveModelProcess } from "src/modelInfo/useModels";
import { getOneFakeModel } from "src/modeldirectory/_test_utilities/mockModelData";
import { EXPORT_PROCESS_STATUS, IMPORT_PROCESS_STATUS } from "src/api-types";

const getInactiveModel = () => {
  const model = getOneFakeModel();
  model.importProcessState = { ...model.importProcessState, status: IMPORT_PROCESS_STATUS.COMPLETED };
  model.exportProcessState = [];
  return model;
};

describe("hasActiveModelProcess", () => {
  test("should return false when given undefined", () => {
    expect(hasActiveModelProcess(undefined)).toBe(false);
  });

  test("should return false when given an empty array", () => {
    expect(hasActiveModelProcess([])).toBe(false);
  });

  test("should return false when no model has an active import or export process", () => {
    // GIVEN a model with no active processes
    const givenModel = getInactiveModel();

    // WHEN checking whether any process is active
    // THEN expect it to return false
    expect(hasActiveModelProcess([givenModel])).toBe(false);
  });

  test.each([
    ["pending", IMPORT_PROCESS_STATUS.PENDING],
    ["running", IMPORT_PROCESS_STATUS.RUNNING],
  ])("should return true when a model's import process is %s", (_desc, status) => {
    // GIVEN a model with an active import process
    const givenModel = getInactiveModel();
    givenModel.importProcessState = { ...givenModel.importProcessState, status };

    // WHEN checking whether any process is active
    // THEN expect it to return true
    expect(hasActiveModelProcess([givenModel])).toBe(true);
  });

  test.each([
    ["pending", EXPORT_PROCESS_STATUS.PENDING],
    ["running", EXPORT_PROCESS_STATUS.RUNNING],
  ])("should return true when a model's export process is %s", (_desc, status) => {
    // GIVEN a model with an active export process
    const givenModel = getInactiveModel();
    givenModel.exportProcessState = [{ ...getOneFakeModel().exportProcessState[0], status }];

    // WHEN checking whether any process is active
    // THEN expect it to return true
    expect(hasActiveModelProcess([givenModel])).toBe(true);
  });

  test("should return true when only one of several models has an active process", () => {
    // GIVEN several models, all inactive except one with an active export process
    const givenInactiveModel1 = getInactiveModel();
    const givenActiveModel = getInactiveModel();
    givenActiveModel.exportProcessState = [
      { ...getOneFakeModel().exportProcessState[0], status: EXPORT_PROCESS_STATUS.RUNNING },
    ];
    const givenInactiveModel2 = getInactiveModel();

    // WHEN checking whether any process is active
    // THEN expect it to return true
    expect(hasActiveModelProcess([givenInactiveModel1, givenActiveModel, givenInactiveModel2])).toBe(true);
  });

  test("should return false when every process on every model has completed", () => {
    // GIVEN several models, all with only completed processes
    const givenModels = [getInactiveModel(), getInactiveModel(), getInactiveModel()];

    // WHEN checking whether any process is active
    // THEN expect it to return false
    expect(hasActiveModelProcess(givenModels)).toBe(false);
  });
});
