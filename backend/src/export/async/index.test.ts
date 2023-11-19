//mute console.log
import "_test_utilities/consoleMock";

import { initOnce } from "server/init";
import * as asyncIndex from "export/async";
import { parseModelToFile } from "export/async/parseModelToFile";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { getMockStringId } from "_test_utilities/mockMongoId";
import exportLogger from "common/errorLogger/errorLogger";
import { IExportProcessState } from "export/exportProcessState/exportProcessState.types";
import { AsyncExportEvent } from "export/async";

// Mock the init function
jest.mock("server/init", () => {
  return {
    initOnce: jest.fn(), // Just create a basic mock without any specific behavior.
  };
});
//Mock the parseModelToFile function
jest.mock("./parseModelToFile", () => ({
  parseModelToFile: jest.fn(),
}));

const getMockExportEvent = (): AsyncExportEvent => {
  return {
    modelId: getMockStringId(1),
    exportProcessStateId: getMockStringId(2),
  };
};

const getMockExportProcessState = (): IExportProcessState => ({
  createdAt: new Date(),
  downloadUrl: "",
  id: "",
  modelId: "",
  result: { errored: false, exportErrors: false, exportWarnings: false },
  status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
  timestamp: new Date(),
  updatedAt: new Date(),
});

describe("Test the main async handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully export", async () => {
    //GIVEN initOnce will successfully resolve
    (initOnce as jest.Mock).mockResolvedValue(Promise.resolve());
    // AND a valid Export event
    const givenEvent = getMockExportEvent();

    // WHEN the handler is invoked with the given event param
    jest.spyOn(exportLogger, "clear"); // spy on the logger clear function
    await asyncIndex.handler(givenEvent);

    // THEN expect the initOnce function to be called
    expect(initOnce).toBeCalledTimes(1);

    // AND the exportLogger to be cleared
    expect(exportLogger.clear).toBeCalledTimes(1);

    // AND expect the parseFiles function to be called
    expect(parseModelToFile).toHaveBeenNthCalledWith(1, givenEvent.exportProcessStateId);
  });

  describe("should fail to export", () => {
    beforeAll(() => {
      // GIVEN the exportProcessStatRepository that will successfully create or update the exportProcessState
      const givenExportProcessStateRepositoryMock = {
        Model: undefined as any,
        create: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(null),
      };
      jest
        .spyOn(getRepositoryRegistry(), "exportProcessState", "get")
        .mockReturnValue(givenExportProcessStateRepositoryMock);
    });

    test("should not throw error and not call parseModelToFile and InitOnce when event does not conform to schema", async () => {
      // GIVEN an event that does not conform to the Export schema
      //@ts-ignore
      const givenBadEvent: Export = { foo: "foo" } as Export;
      // WHEN the main handler is invoked with the given bad event
      const actualPromiseHandler = () => asyncIndex.handler(givenBadEvent);

      // THEN expect it to return without throwing an error
      expect(actualPromiseHandler).not.toThrowError();
      // AND exportProcessStateRepository.create should not have been called
      expect(getRepositoryRegistry().exportProcessState.create).not.toHaveBeenCalled();
      // AND exportProcessStateRepository.update should not have been called
      expect(getRepositoryRegistry().exportProcessState.update).not.toHaveBeenCalled();
    });

    test("should throw error and not call parseModelToFiles when initOnce fails", async () => {
      // GIVEN initOnce will fail
      (initOnce as jest.Mock).mockRejectedValueOnce(new Error("foo"));

      const givenExportEvent = getMockExportEvent();

      // WHEN the handler is invoked with a valid event
      const actualPromiseHandler = () => asyncIndex.handler(givenExportEvent);

      // THEN expect the handler to throw an error
      await expect(actualPromiseHandler).rejects.toThrow("foo");
      // AND parseFiles not to have been called
      expect(parseModelToFile).not.toHaveBeenCalled();
      // AND expect the status to not have been updated or created
      expect(getRepositoryRegistry().exportProcessState.create).not.toHaveBeenCalled();
      expect(getRepositoryRegistry().exportProcessState.update).not.toHaveBeenCalled();
    });

    test("should not throw error when parseFiles fails", async () => {
      // GIVEN a valid event
      const givenExportEvent = getMockExportEvent();

      // AND parseFiles will fail
      (parseModelToFile as jest.Mock).mockRejectedValueOnce(new Error("foo"));

      // WHEN the handler is invoked
      const actualHandler = () => asyncIndex.handler(givenExportEvent);
      await actualHandler();

      // THEN expect the handler not to throw an error
      expect(actualHandler).not.toThrow();
      // AND expect the exportProcessState to have been updated with a status of COMPLETED and a results object with errored true
      expect(getRepositoryRegistry().exportProcessState.update).toHaveBeenCalledWith(
        givenExportEvent.exportProcessStateId,
        {
          status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
          result: {
            errored: true,
            exportErrors: false,
            exportWarnings: false,
          },
        }
      );
    });
  });
});
