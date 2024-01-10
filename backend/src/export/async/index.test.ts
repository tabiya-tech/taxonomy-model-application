//mute console.log
import "_test_utilities/consoleMock";

import { initOnce } from "server/init";
import * as asyncIndex from "export/async";
import { AsyncExportEvent } from "export/async/async.types";
import { modelToS3 } from "export/async/modelToS3";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { getMockStringId } from "_test_utilities/mockMongoId";
import exportLogger from "common/errorLogger/errorLogger";
import { IExportProcessState, IUpdateExportProcessStateSpec } from "export/exportProcessState/exportProcessState.types";

// Mock the init function
jest.mock("server/init", () => {
  return {
    initOnce: jest.fn(), // Just create a basic mock without any specific behavior.
  };
});
//Mock the parseModelToFile function
jest.mock("./modelToS3", () => ({
  modelToS3: jest.fn(),
}));

// Mock the exportProcessStateRepository
jest.mock("server/repositoryRegistry/repositoryRegistry", () => {
  return {
    getRepositoryRegistry: jest.fn().mockReturnValue({
      exportProcessState: {
        Model: undefined as never,
        create: jest.fn(),
        update: jest
          .fn()
          .mockImplementation(
            (id: string, updateSpecs: IUpdateExportProcessStateSpec): Promise<IExportProcessState> => {
              console.log("update called", id, updateSpecs);
              return Promise.resolve(getMockExportProcessState());
            }
          ),
        findById: jest.fn().mockImplementation(() => {
          return Promise.resolve(getMockExportProcessState());
        }),
      },
    }),
  };
});

const getMockExportEvent = (): AsyncExportEvent => {
  return {
    modelId: getMockStringId(1),
    exportProcessStateId: getMockStringId(2),
  };
};

const getMockExportProcessState = (): IExportProcessState => ({
  createdAt: new Date(),
  downloadUrl: "",
  id: getMockStringId(1),
  modelId: "",
  result: { errored: false, exportErrors: false, exportWarnings: false },
  status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
  timestamp: new Date(),
  updatedAt: new Date(),
});

describe("Test the main async handler", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully export", async () => {
    //GIVEN initOnce will successfully resolve
    (initOnce as jest.Mock).mockResolvedValue(Promise.resolve());
    // AND the exportProcessStateRepository that will successfully find the exportProcessState
    jest
      .spyOn(getRepositoryRegistry().exportProcessState, "findById")
      .mockResolvedValueOnce(getMockExportProcessState());

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
    expect(modelToS3).toHaveBeenCalledTimes(1);
    expect(modelToS3).toHaveBeenCalledWith(givenEvent);
  });

  describe("should fail to export", () => {
    beforeAll(() => {
      // GIVEN initOnce will successfully resolve
      (initOnce as jest.Mock).mockResolvedValue(Promise.resolve());
    });

    test.each([
      ["modelId is missing", { exportProcessStateId: "foo" } as AsyncExportEvent],
      ["exportProcessStateId missing", { modelId: "foo" } as AsyncExportEvent],
      ["both are missing", { foo: "bar" } as unknown as AsyncExportEvent],
    ])(
      "should not throw error and not call parseModelToFile and InitOnce when %s",
      async (description: string, givenBadEvent: AsyncExportEvent) => {
        // GIVEN an event that does not conform to the expected export event
        // WHEN the main handler is invoked with the given bad event
        const actualPromiseHandler = () => asyncIndex.handler(givenBadEvent);

        // THEN expect it to return without throwing an error
        expect(actualPromiseHandler).not.toThrowError();

        // AND expect parseModelToFile not to have been called
        expect(modelToS3).not.toHaveBeenCalled();
        // AND expect initOnce not to have been called
        expect(initOnce).not.toHaveBeenCalled();
        // AND exportProcessStateRepository.create should not have been called
        expect(getRepositoryRegistry().exportProcessState.create).not.toHaveBeenCalled();
        // AND exportProcessStateRepository.update should not have been called
        expect(getRepositoryRegistry().exportProcessState.update).not.toHaveBeenCalled();
      }
    );

    test("should throw error and not call parseModelToFiles when initOnce fails", async () => {
      // GIVEN initOnce will fail
      (initOnce as jest.Mock).mockRejectedValueOnce(new Error("foo"));

      const givenExportEvent = getMockExportEvent();

      // WHEN the handler is invoked with a valid event
      const actualPromiseHandler = () => asyncIndex.handler(givenExportEvent);

      // THEN expect the handler to throw an error
      await expect(actualPromiseHandler).rejects.toThrow("foo");
      // AND parseFiles not to have been called
      expect(modelToS3).not.toHaveBeenCalled();
      // AND expect the status to not have been updated or created
      expect(getRepositoryRegistry().exportProcessState.create).not.toHaveBeenCalled();
      expect(getRepositoryRegistry().exportProcessState.update).not.toHaveBeenCalled();
    });

    test("should not throw error and not call parseModelToFile when exportProcessStateRepository.findById fails", async () => {
      //GIVEN exportProcessStateRepository.find will fail
      const givenExportError = new Error("foo");
      (getRepositoryRegistry().exportProcessState.findById as jest.Mock).mockRejectedValueOnce(givenExportError);

      // WHEN the handler is invoked with a valid event
      const givenExportEvent = getMockExportEvent();

      // THEN expect the handler to not throw an error
      await expect(asyncIndex.handler(givenExportEvent)).resolves.toBeUndefined();
    });

    test("should not throw error and not call parseModelToFile when there is no exportProcessState for the given id", async () => {
      //GIVEN exportProcessStateRepository.find will return null
      (getRepositoryRegistry().exportProcessState.findById as jest.Mock).mockResolvedValueOnce(null);

      // WHEN the handler is invoked with a valid event
      const givenExportEvent = getMockExportEvent();

      // THEN expect the handler to not throw an error
      await expect(asyncIndex.handler(givenExportEvent)).resolves.toBeUndefined();
    });

    test.each([
      ["Running", ExportProcessStateAPISpecs.Enums.Status.RUNNING],
      ["Completed", ExportProcessStateAPISpecs.Enums.Status.COMPLETED],
    ])(
      "should not throw error and not call parseModelToFile when exportProcessState status is not PENDING (%s)",
      async (_description: string, givenStatus: ExportProcessStateAPISpecs.Enums.Status) => {
        // GIVEN exportProcessStateRepository.find will return a not PENDING status
        const givenExportProcessState = getMockExportProcessState();
        givenExportProcessState.status = givenStatus;
        jest
          .spyOn(getRepositoryRegistry().exportProcessState, "findById")
          .mockResolvedValueOnce(givenExportProcessState);

        // WHEN the handler is invoked with a valid event
        const givenExportEvent = getMockExportEvent();

        // THEN expect the handler not to throw an error
        await expect(asyncIndex.handler(givenExportEvent)).resolves.toBeUndefined();
        // AND the error to be logged
        expect(console.error).toHaveBeenCalledWith(
          `Export failed. The exportProcessState status is not PENDING, it is ${givenStatus}`
        );
      }
    );

    test("should not throw error when parseFiles fails", async () => {
      // GIVEN parseModelToFile will fail
      (modelToS3 as jest.Mock).mockRejectedValueOnce(new Error("foo"));

      // WHEN the handler is invoked with a valid event
      const givenExportEvent = getMockExportEvent();

      // THEN expect the handler to not throw an error
      await expect(asyncIndex.handler(givenExportEvent)).resolves.toBeUndefined();

      // AND expect the update method to have been called with specific arguments
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

    test("should set exportErrors to true when errorLogger has errors ", async () => {
      // GIVEN parseModelToFile will fail and log an export error
      (modelToS3 as jest.Mock).mockImplementationOnce(() => {
        exportLogger.logError(new Error("foo"));
        throw new Error("bar");
      });
      // WHEN the handler is invoked with a valid event
      const givenExportEvent = getMockExportEvent();

      // THEN expect the handler to not throw an error
      await expect(asyncIndex.handler(givenExportEvent)).resolves.toBeUndefined();

      // AND expect the update method to have been called with export errors
      expect(getRepositoryRegistry().exportProcessState.update).toHaveBeenCalledWith(
        givenExportEvent.exportProcessStateId,
        {
          status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
          result: {
            errored: true,
            exportErrors: true,
            exportWarnings: false,
          },
        }
      );
      // reset the export errors
      exportLogger.clear();
    });

    test("should set exportWarnings to true when errorLogger has warnings ", async () => {
      // GIVEN parseModelToFile will fail and log an export warning
      (modelToS3 as jest.Mock).mockImplementationOnce(() => {
        exportLogger.logWarning(new Error("foo"));
        throw new Error("bar");
      });

      // WHEN the handler is invoked with a valid event
      const givenExportEvent = getMockExportEvent();

      // THEN expect the handler to not throw an error
      await expect(asyncIndex.handler(givenExportEvent)).resolves.toBeUndefined();

      // AND expect the update method to have been called with specific arguments
      expect(getRepositoryRegistry().exportProcessState.update).toHaveBeenCalledWith(
        givenExportEvent.exportProcessStateId,
        {
          status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
          result: {
            errored: true,
            exportErrors: false,
            exportWarnings: true,
          },
        }
      );
    });
  });
});
