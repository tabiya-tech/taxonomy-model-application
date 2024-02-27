//mute console.log
import "_test_utilities/consoleMock";

jest.mock("export/esco/iscoGroup/ISCOGroupsToCSVTransform", () => {
  // std mock should return a transform stream with some data
  return jest.fn().mockImplementation(() => {
    return Readable.from(["foo", "bar", "baz"], { objectMode: true });
  });
});

jest.mock("export/esco/occupation/OccupationsToCSVTransform", () => {
  // std mock should return a transform stream with some data
  return jest.fn().mockImplementation(() => {
    return Readable.from(["foo", "bar", "baz"], { objectMode: true });
  });
});

jest.mock("export/esco/skill/SkillsToCSVTransform", () => {
  // std mock should return a transform stream with some data
  return jest.fn().mockImplementation(() => {
    return Readable.from(["foo", "bar", "baz"], { objectMode: true });
  });
});

jest.mock("export/esco/skillGroup/SkillGroupsToCSVTransform", () => {
  // std mock should return a transform stream with some data
  return jest.fn().mockImplementation(() => {
    return Readable.from(["foo", "bar", "baz"], { objectMode: true });
  });
});

jest.mock("export/esco/occupationHierarchy/occupationHierarchyToCSVTransform", () => {
  // std mock should return a transform stream with some data
  return jest.fn().mockImplementation(() => {
    return Readable.from(["foo", "bar", "baz"], { objectMode: true });
  });
});

jest.mock("export/esco/skillHierarchy/skillHierarchyToCSVTransform", () => {
  // std mock should return a transform stream with some data
  return jest.fn().mockImplementation(() => {
    return Readable.from(["foo", "bar", "baz"], { objectMode: true });
  });
});

jest.mock("export/esco/occupationToSkillRelation/occupationToSkillRelationToCSVTransform", () => {
  // std mock should return a transform stream with some data
  return jest.fn().mockImplementation(() => {
    return Readable.from(["foo", "bar", "baz"], { objectMode: true });
  });
});

jest.mock("export/esco/skillToSkillRelation/skillToSkillRelationToCSVTransform", () => {
  // std mock should return a transform stream with some data
  return jest.fn().mockImplementation(() => {
    return Readable.from(["foo", "bar", "baz"], { objectMode: true });
  });
});

jest.mock("export/modelInfo/modelInfoToCSVTransform", () => {
  // std mock should return a transform stream with some data
  return jest.fn().mockImplementation(() => {
    return Readable.from(["foo", "bar", "baz"], { objectMode: true });
  });
});

jest.mock("export/async/CSVtoZipPipeline", () => {
  // std mock should return the actual
  const actualModule = jest.requireActual("export/async/CSVtoZipPipeline");
  // spy on the default export to simplify testing
  jest.spyOn(actualModule, "default");
  return {
    __esModule: true,
    default: actualModule,
    ...actualModule,
  };
});

jest.mock("./uploadZipToS3", () => {
  // std mock should consume the updateStream
  return jest
    .fn()
    .mockImplementation(
      async (uploadStream: stream.Readable, _fileName: string, _region: string, _bucketName: string) => {
        // consume the stream
        for await (const _data of uploadStream) {
          // do nothing
        }
      }
    );
});

//mock the archiver
// a call back used to add additional spies to the newly instantiated Archiver mock before it is returned
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let callbackArchiverCreated: ((archiver: any) => void) | undefined = undefined;
jest.mock("archiver", () => {
  // std mock should return the actual zipper with spies to simplify testing
  const actual = jest.requireActual("archiver");
  // we need to know up front what the create method will return in order to spy on the finalize and pipe,
  // it before it is called from modelToS3()
  const originalCreateFN = actual.create;
  jest.spyOn(actual, "create").mockImplementation(() => {
    const mockZipper = originalCreateFN("zip", { zlib: { level: 9 }, statConcurrency: 4 });
    jest.spyOn(mockZipper, "pipe");
    jest.spyOn(mockZipper, "finalize");
    if (callbackArchiverCreated) {
      callbackArchiverCreated(mockZipper);
      callbackArchiverCreated = undefined;
    }
    return mockZipper;
  });
  return {
    __esModule: true,
    default: actual,
    ...actual,
  };
});

jest.mock("server/repositoryRegistry/repositoryRegistry", () => {
  // mock the exportProcessState repository
  const _mockExportProcessStateRepositoryInstance = {
    Model: undefined as never,
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  };

  const actual = jest.requireActual("server/repositoryRegistry/repositoryRegistry");

  // Ensure the getRepositoryRegistry always returns the same mock instance
  jest.spyOn(actual, "getRepositoryRegistry").mockReturnValue({
    get exportProcessState() {
      return _mockExportProcessStateRepositoryInstance;
    },
  });

  return {
    __esModule: true,
    default: actual,
    ...actual,
  };
});

import * as Config from "server/config/config";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { AsyncExportEvent } from "./async.types";
import { FILENAMES, modelToS3 } from "./modelToS3";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import uploadZipToS3 from "./uploadZipToS3";
import { getMockStringId } from "_test_utilities/mockMongoId";
import stream, { Readable } from "stream";
import errorLogger from "common/errorLogger/errorLogger";
import archiver from "archiver";
import CSVtoZipPipeline from "./CSVtoZipPipeline";
import ISCOGroupsToCSVTransform from "export/esco/iscoGroup/ISCOGroupsToCSVTransform";
import SkillsToCSVTransform from "export/esco/skill/SkillsToCSVTransform";
import SkillGroupsToCSVTransform from "export/esco/skillGroup/SkillGroupsToCSVTransform";
import OccupationHierarchyToCSVTransform from "export/esco/occupationHierarchy/occupationHierarchyToCSVTransform";
import SkillHierarchyToCSVTransform from "export/esco/skillHierarchy/skillHierarchyToCSVTransform";
import OccupationToSkillRelationToCSVTransform from "export/esco/occupationToSkillRelation/occupationToSkillRelationToCSVTransform";
import SkillToSkillRelationToCSVTransform from "export/esco/skillToSkillRelation/skillToSkillRelationToCSVTransform";
import ModelInfoToCSVTransform from "export/modelInfo/modelInfoToCSVTransform";
import OccupationsToCSVTransform from "export/esco/occupation/OccupationsToCSVTransform";

jest.spyOn(errorLogger, "logError");
jest.spyOn(errorLogger, "logWarning");

const getMockExportEvent = (): AsyncExportEvent => {
  return {
    modelId: getMockStringId(1),
    exportProcessStateId: getMockStringId(2),
  };
};

describe("modelToS3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully export model data and upload to S3", async () => {
    // GIVEN an AsyncExportEvent with a modelId
    const givenEvent: AsyncExportEvent = getMockExportEvent();

    // AND given the download bucket name and region
    const givenDownloadBucketName = "foo";
    const givenDownloadBucketRegion = "bar";
    jest.spyOn(Config, "getDownloadBucketName").mockReturnValue(givenDownloadBucketName);
    jest.spyOn(Config, "getDownloadBucketRegion").mockReturnValue(givenDownloadBucketRegion);

    // WHEN the modelToS3 function is called
    const modelToS3Promise = modelToS3(givenEvent);

    // THEN expect it to successfully resolves
    await expect(modelToS3Promise).resolves.toBeUndefined();

    // AND initially the exportProcessStateRepository successfully updated the exportProcessState to RUNNING
    expect(getRepositoryRegistry().exportProcessState.update).toHaveBeenNthCalledWith(
      1,
      givenEvent.exportProcessStateId,
      {
        status: ExportProcessStateAPISpecs.Enums.Status.RUNNING, // AND the result is not errored and has no errors or warnings
        result: {
          errored: false,
          exportErrors: false,
          exportWarnings: false,
        },
      }
    );

    // AND the archiver to pipe the zip stream to a passThrough stream (which is passed to the uploadZipToS3 function for upload)
    const actualZipper: archiver.Archiver = (archiver.create as jest.Mock).mock.results[0].value;
    expect(actualZipper.pipe).toHaveBeenCalledWith(expect.any(stream.PassThrough));

    // AND for each collection in the database
    [
      [ISCOGroupsToCSVTransform, FILENAMES.ISCOGroups],
      [OccupationsToCSVTransform, FILENAMES.Occupations],
      [SkillGroupsToCSVTransform, FILENAMES.SkillGroups],
      [SkillsToCSVTransform, FILENAMES.Skills],
      [OccupationHierarchyToCSVTransform, FILENAMES.OccupationHierarchy],
      [SkillHierarchyToCSVTransform, FILENAMES.SkillHierarchy],
      [OccupationToSkillRelationToCSVTransform, FILENAMES.OccupationToSkillRelations],
      [SkillToSkillRelationToCSVTransform, FILENAMES.SkillToSkillRelations],
      [ModelInfoToCSVTransform, FILENAMES.ModelInfo],
    ].forEach(([transform, filename]) => {
      // EXPECT the collection to be transfomred to CSV
      expect(transform).toHaveBeenCalledWith(givenEvent.modelId);
      // AND the CSV to be zipped to the correct filename
      expect(CSVtoZipPipeline).toHaveBeenCalledWith(
        expect.any(String),
        filename,
        (transform as jest.Mock<stream.Readable>).mock.results[0].value,
        actualZipper,
        expect.any(Function)
      );
    });

    // AND an archiver to be created with the correct options for a zip file
    expect(archiver.create).toHaveBeenCalledWith(
      "zip",
      expect.objectContaining({
        zlib: { level: 9 },
        statConcurrency: 4,
      })
    );

    // AND the archiver to finalize the zip stream
    expect(actualZipper.finalize).toHaveBeenCalled();

    // AND the uploadZipToS3 is called with a pass-through, the zip file name, the bucket region and the bucket name
    expect(uploadZipToS3).toHaveBeenCalledWith(
      expect.any(stream.PassThrough),
      `${givenEvent.modelId}-export-${givenEvent.exportProcessStateId}.zip`,
      givenDownloadBucketRegion,
      givenDownloadBucketName
    );

    // AND the passThrough  the archiver pipes to is the passThrough that is passed to the uploadZipToS3 function
    expect((actualZipper.pipe as jest.Mock).mock.calls[0][0]).toBe((uploadZipToS3 as jest.Mock).mock.calls[0][0]);

    // AND the exportProcessStateRepository successfully updated the exportProcessState to COMPLETED
    expect(getRepositoryRegistry().exportProcessState.update).lastCalledWith(givenEvent.exportProcessStateId, {
      status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED, // AND the result is not errored and has no errors or warnings
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      }, // AND the downloadUrl is set to the correct url
      downloadUrl: `https://${givenDownloadBucketName}.s3.${givenDownloadBucketRegion}.amazonaws.com/${givenEvent.modelId}-export-${givenEvent.exportProcessStateId}.zip`,
    });

    // AND All resources have been released
    await assertThatAllCreatedResourcesAreReleased(true);
  });

  describe("should handle streaming errors emitted during the upstream DB-Collection-ToCSVTransform", () => {
    test.each([
      ["ISCOGroupsToCSVTransformStream", ISCOGroupsToCSVTransform],
      ["OccupationsToCSVTransformStream", OccupationsToCSVTransform],
      ["SkillGroupsToCSVTransformStream", SkillGroupsToCSVTransform],
      ["SkillsToCSVTransformStream", SkillsToCSVTransform],
      ["OccupationHierarchyToCSVTransformStream", OccupationHierarchyToCSVTransform],
      ["SkillHierarchyToCSVTransformStream", SkillHierarchyToCSVTransform],
      ["OccupationToSkillRelationToCSVTransformStream", OccupationToSkillRelationToCSVTransform],
      ["SkillToSkillRelationToCSVTransformStream", SkillToSkillRelationToCSVTransform],
      ["ModelInfoToCSVTransformStream", ModelInfoToCSVTransform],
    ])("should reject and release resources when the %s emits errors", async (_caseDescription, givenFailingStream) => {
      const failureCallback = () =>
        (givenFailingStream as jest.Mock).mockImplementationOnce(() => {
          return Readable.from(["foo", "bar", "baz"], { objectMode: true }).on("data", function () {
            // @ts-ignore
            this.emit("error", new Error("foo"));
          });
        });
      await testFailure(
        failureCallback,
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "Premature close",
        true
      );
    });
  });

  describe("should handle Thrown errors and Rejections thrown during export process", () => {
    test.each([
      [
        "the exportProcessState will fail to update and rejects with an error",
        "foo",
        undefined,
        () => {
          // given the exportProcessStateRepository will fail to update the exportProcessState
          jest.spyOn(getRepositoryRegistry().exportProcessState, "update").mockRejectedValueOnce(new Error("foo"));
        },
      ],
      [
        "the exportProcessState will fail to update and throws an error",
        "foo",
        undefined,
        () => {
          // given the exportProcessStateRepository will fail to update the exportProcessState
          jest.spyOn(getRepositoryRegistry().exportProcessState, "update").mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "the archiver will fail to initialize and throws an error",
        "foo",
        undefined,
        () => {
          //given the archiver will fail to initialize
          jest.spyOn(archiver, "create").mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "ISCOGroupsToCSVTransform throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (ISCOGroupsToCSVTransform as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "OccupationToCSVTransform throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (OccupationsToCSVTransform as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "SkillToCSVTransform throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (SkillsToCSVTransform as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "SkillGroupToCSVTransform throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (SkillGroupsToCSVTransform as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "OccupationHierarchyToCSVTransform throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (OccupationHierarchyToCSVTransform as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "SkillHierarchyToCSVTransform throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (SkillHierarchyToCSVTransform as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "OccupationToSkillRelationToCSVTransform throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (OccupationToSkillRelationToCSVTransform as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "SkillToSkillRelationToCSVTransform throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (SkillToSkillRelationToCSVTransform as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "ModelInfoToCSVTransform throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (ModelInfoToCSVTransform as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "the csvToZipPipeline throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (CSVtoZipPipeline as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "the archiver fails to pipe and throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          callbackArchiverCreated = (zipper) => {
            (zipper.pipe as jest.Mock).mockImplementationOnce(() => {
              throw new Error("foo");
            });
          };
        },
      ],
      [
        "the archiver fails to finalize and throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          callbackArchiverCreated = (zipper) => {
            (zipper.finalize as jest.Mock).mockImplementationOnce(() => {
              throw new Error("foo");
            });
          };
        },
      ],
      [
        "the archiver fails to finalize and rejects with an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          callbackArchiverCreated = (zipper) => {
            (zipper.finalize as jest.Mock).mockRejectedValueOnce(new Error("foo"));
          };
        },
      ],
      [
        "the uploadToS3 module rejects with an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (uploadZipToS3 as jest.Mock).mockImplementationOnce(() => {
            throw new Error("foo");
          });
        },
      ],
      [
        "the uploadToS3 module throws an error",
        "An error occurred while streaming data from the DB to the csv zip file on S3",
        "foo",
        () => {
          (uploadZipToS3 as jest.Mock).mockRejectedValueOnce(new Error("foo"));
        },
      ],
    ])(
      "should cleanup resources and throw when %s",
      async (
        _description: string,
        errorMessage: string,
        causeMessage: string | undefined,
        failureCallback: () => void
      ) => {
        await testFailure(failureCallback, errorMessage, causeMessage, false);
      }
    );
  });
});

async function testFailure(
  failureCallback: () => void,
  expectedErrorMessage: string,
  expectedCause: string | undefined,
  assertCreated: boolean
) {
  // GIVEN an AsyncExportEvent with a modelId
  const givenEvent: AsyncExportEvent = getMockExportEvent();

  // AND given the download bucket name and region
  const givenDownloadBucketName = "foo";
  const givenDownloadBucketRegion = "bar";
  jest.spyOn(Config, "getDownloadBucketName").mockReturnValue(givenDownloadBucketName);
  jest.spyOn(Config, "getDownloadBucketRegion").mockReturnValue(givenDownloadBucketRegion);

  // AND given a dependency throws an error
  failureCallback();

  // WHEN the parseModelToFile function is called
  const actualModelToS3Promise = modelToS3(givenEvent);

  // THEN expect it to throw an error
  await expect(actualModelToS3Promise).rejects.toThrowError(
    expect.toMatchErrorWithCause(expectedErrorMessage, expectedCause)
  );

  // AND initially the exportProcessStateRepository successfully updated the exportProcessState to RUNNING
  expect(getRepositoryRegistry().exportProcessState.update).toHaveBeenNthCalledWith(
    1,
    givenEvent.exportProcessStateId,
    {
      status: ExportProcessStateAPISpecs.Enums.Status.RUNNING, // AND the result is not errored and has no errors or warnings
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
    }
  );

  // AND the exportProcessStateRepository was not updated, the caller will take care of it
  expect(getRepositoryRegistry().exportProcessState.update).toHaveBeenCalledTimes(1);

  // AND All created resources have been released
  await assertThatAllCreatedResourcesAreReleased(assertCreated);
}

async function assertStreamIsClosedAndDestroyed(stream: Readable) {
  await new Promise((resolve) =>
    setImmediate(() => resolve("Flush all micro tasks so that the close events can be emitted and consumed."))
  );
  expect(stream.closed).toBe(true);
  expect(stream.destroyed).toBe(true);
}

async function assertThatAllCreatedResourcesAreReleased(assertCreated: boolean) {
  // Assert the actualZipper is destroyed
  // The archiver does not have a closed property, so we need to check only the destroyed property
  const archiver_create_results = (archiver.create as jest.Mock).mock.results;
  if (assertCreated) {
    expect(archiver_create_results.length).toBe(1);
  }
  for (const result of archiver_create_results) {
    if (result.type === "return") {
      const actualZipper: archiver.Archiver = result.value;
      expect(actualZipper.destroyed).toBe(true);
    }
  }
  // For each Collection in the DB
  // Assert the ISCOGroupsToCSV stream resources are released
  const collectionToCSVTransformMocks = [
    ISCOGroupsToCSVTransform,
    OccupationsToCSVTransform,
    SkillGroupsToCSVTransform,
    SkillsToCSVTransform,
    OccupationHierarchyToCSVTransform,
    SkillHierarchyToCSVTransform,
    OccupationToSkillRelationToCSVTransform,
    SkillToSkillRelationToCSVTransform,
    ModelInfoToCSVTransform,
  ];
  for (const mock of collectionToCSVTransformMocks) {
    const results = (mock as jest.Mock).mock.results;
    if (assertCreated) {
      expect(results.length).toBe(1);
    }
    for (const result of results) {
      if (result.type === "return") {
        const stream: archiver.Archiver = result.value;
        await assertStreamIsClosedAndDestroyed(stream);
      }
    }
  }
  //----
  // Assert all the CSVtoZipPipeline stream resources are released
  const CSVtoZipPipeline_results = (CSVtoZipPipeline as jest.Mock).mock.results;
  if (assertCreated) {
    expect(CSVtoZipPipeline_results.length).toEqual(collectionToCSVTransformMocks.length);
  }

  for await (const result of (CSVtoZipPipeline as jest.Mock).mock.results) {
    if (result.type === "return") {
      const CSVtoZipPipelineStream = result.value as Readable;
      await assertStreamIsClosedAndDestroyed(CSVtoZipPipelineStream);
    }
  }

  // Assert UploadZipToS3 (passThrough) to be cleaned up
  const UploadZipToS3_calls = (uploadZipToS3 as jest.Mock).mock.calls;
  if (assertCreated) {
    expect(UploadZipToS3_calls.length).toBe(1);
  }
  for (const call of UploadZipToS3_calls) {
    const sourceUploadStream = call[0] as Readable;
    await assertStreamIsClosedAndDestroyed(sourceUploadStream);
  }
}
