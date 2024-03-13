//mute console.log
import "_test_utilities/consoleMock";
// ##############
import * as asyncIndex from "./index";
import ImportAPISpecs from "api-specifications/import";

import { initOnce } from "server/init";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { parseFiles } from "./parseFiles";
import ImportProcessStateAPISpec from "api-specifications/importProcessState";
import errorLogger from "common/errorLogger/errorLogger";

// ##############
// Mock the init function
jest.mock("server/init", () => {
  return {
    initOnce: jest.fn(), // Just create a basic mock without any specific behavior.
  };
});

//Mock the parseFiles function
jest.mock("./parseFiles", () => ({
  parseFiles: jest.fn(),
}));

const getMockImportEvent = (): ImportAPISpecs.Types.POST.Request.Payload => {
  return {
    filePaths: {
      [ImportAPISpecs.Constants.ImportFileTypes.ISCO_GROUPS]: "path/to/ISCO_GROUPS.csv",
      [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATIONS]: "path/to/OCCUPATIONS.csv",
      [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUPS]: "path/to/ESCO_SKILL_GROUPS.csv",
      [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILLS]: "path/to/ESCO_SKILLS.csv",
      [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_HIERARCHY]: "path/to/OCCUPATION_HIERARCHY.csv",
      [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_HIERARCHY]: "path/to/ESCO_SKILL_HIERARCHY.csv",
      [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_SKILL_RELATIONS]: "path/to/ESCO_SKILL_SKILL_RELATIONS.csv",
      [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_SKILL_RELATIONS]: "path/to/OCCUPATION_SKILL_RELATIONS.csv",
      // ADD additional file types here
    },
    modelId: getMockStringId(1),
  };
};

describe("Test the main async handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully import", async () => {
    //GIVEN initOnce will successfully resolve
    (initOnce as jest.Mock).mockResolvedValue(Promise.resolve());
    // AND a valid Import event
    const givenEvent = getMockImportEvent();

    // WHEN the handler is invoked with the given event param
    jest.spyOn(errorLogger, "clear"); // spy on the logger clear function
    await asyncIndex.handler(givenEvent);

    // THEN expect the initOnce function to be called
    expect(initOnce).toBeCalledTimes(1);

    // AND the errorLogger to be cleared
    expect(errorLogger.clear).toBeCalledTimes(1);

    // AND expect the parseFiles function to be called
    expect(parseFiles).toHaveBeenCalledTimes(1);
    expect(parseFiles).toHaveBeenCalledWith(givenEvent);
  });

  describe("should fail to import", () => {
    beforeAll(() => {
      // GIVEN the importProcessStatRepository that will successfully create or update the importProcessState
      const givenImportProcessStateRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(null),
      };
      jest
        .spyOn(getRepositoryRegistry(), "importProcessState", "get")
        .mockReturnValue(givenImportProcessStateRepositoryMock);
    });

    test("should not throw error and not call parseFiles and InitOnce when event does not conform to schema", async () => {
      // GIVEN an event that does not conform to the Import schema
      //@ts-ignore
      const givenBadEvent: Import = { foo: "foo" } as Import;
      // WHEN the main handler is invoked with the given bad event
      const actualPromiseHandler = () => asyncIndex.handler(givenBadEvent);

      // THEN expect it to return without throwing an error
      expect(actualPromiseHandler).not.toThrowError();
      // AND importProcessStateRepository.create should not have been called
      expect(getRepositoryRegistry().importProcessState.create).not.toHaveBeenCalled();
      // AND importProcessStateRepository.update should not have been called
      expect(getRepositoryRegistry().importProcessState.update).not.toHaveBeenCalled();
    });

    test("should throw error and not call parseFiles when initOnce fails", async () => {
      // GIVEN initOnce will fail
      (initOnce as jest.Mock).mockRejectedValueOnce(new Error("foo"));

      // WHEN the handler is invoked with a valid event
      const actualPromiseHandler = () => asyncIndex.handler(getMockImportEvent());

      // THEN expect the handler to throw an error
      await expect(actualPromiseHandler).rejects.toThrow("foo");
      // AND parseFiles not to have been called
      expect(parseFiles).not.toHaveBeenCalled();
      // AND expect the status to not have been updated or created
      expect(getRepositoryRegistry().importProcessState.create).not.toHaveBeenCalled();
      expect(getRepositoryRegistry().importProcessState.update).not.toHaveBeenCalled();
    });

    test("should not throw error when parseFiles fails", async () => {
      // GIVEN a valid event
      const givenEvent = getMockImportEvent();
      // AND the event refers to a model that exists in the db and has an importProcessStateId

      const givenImportProcessStateId = getMockStringId(2);

      const givenModelInfoRepositoryMock = {
        Model: undefined as never,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue({
          id: givenEvent.modelId,
          importProcessState: {
            id: givenImportProcessStateId,
          },
        }),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue([]),
        getHistory: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // AND parseFiles will fail
      (parseFiles as jest.Mock).mockRejectedValueOnce(new Error("foo"));

      // WHEN the handler is invoked
      await asyncIndex.handler(getMockImportEvent());

      // THEN expect the handler not to throw an error
      expect(asyncIndex.handler).not.toThrowError();
      // AND expect the importProcessState to have been updated with a status of COMPLETED and a results object with errored true
      expect(getRepositoryRegistry().importProcessState.update).toHaveBeenCalledWith(givenImportProcessStateId, {
        status: ImportProcessStateAPISpec.Enums.Status.COMPLETED,
        result: {
          errored: true,
          parsingErrors: false,
          parsingWarnings: false,
        },
      });
    });
  });
});
