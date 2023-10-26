//mute console.log
import "_test_utilities/consoleMock";

// Mock the configuration
jest.mock("server/config/config", () => {
  const mockConfiguration = {
    dbURI: "mongodb://username@password:server:port/database",
    resourcesBaseUrl: "https://path/to/resource",
    uploadBucketName: "bucket name",
    uploadBucketRegion: "bucket region",
    asyncLambdaFunctionRegion: "async function region",
    asyncLambdaFunctionArn: "function arn",
  };
  return {
    getUploadBucketName: jest.fn().mockImplementation(() => {
      return mockConfiguration.uploadBucketName;
    }),
    getUploadBucketRegion: jest.fn().mockImplementation(() => {
      return mockConfiguration.uploadBucketRegion;
    }),
  };
});

// Mock the S3PresignerService
const mockS3PresignerServiceInstance = {
  getPresignedGet: jest.fn().mockImplementation((filePath: string) => {
    return Promise.resolve(`presigned url for ${filePath}`);
  }),
};

jest.mock("./S3PresignerService", () => {
  return {
    S3PresignerService: jest.fn().mockReturnValue(mockS3PresignerServiceInstance),
  };
});

// Mock the ISCOGroupsParser
jest.mock("import/esco/ISCOGroups/ISCOGroupsParser", () => {
  return {
    parseISCOGroupsFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 100,
      rowsSuccess: 100,
      rowsFailed: 0,
    } as RowsProcessedStats),
  };
});
// Mock the ESCOSkillGroupsParser
jest.mock("import/esco/skillGroups/skillGroupsParser.ts", () => {
  return {
    parseSkillGroupsFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 200,
      rowsSuccess: 200,
      rowsFailed: 0,
    } as RowsProcessedStats),
  };
});

// Mock the ESCOSkillParser
jest.mock("import/esco/skills/skillsParser.ts", () => {
  return {
    parseSkillsFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 300,
      rowsSuccess: 300,
      rowsFailed: 0,
    } as RowsProcessedStats),
  };
});

// Mock the OccupationsParser
jest.mock("import/esco/occupations/occupationsParser.ts", () => {
  return {
    parseOccupationsFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 200,
      rowsSuccess: 200,
      rowsFailed: 0,
    } as RowsProcessedStats),
  };
});

// Mock the OccupationHierarchyParser
jest.mock("import/esco/occupationHierarchy/occupationHierarchyParser.ts", () => {
  return {
    parseOccupationHierarchyFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      // countISCOGroups + countOccupations - 10
      rowsProcessed: 100 + 200 - 10,
      rowsSuccess: 100 + 200 - 10,
      rowsFailed: 0,
    } as RowsProcessedStats),
  };
});

// Mock the SkillHierarchyParser
jest.mock("import/esco/skillHierarchy/skillHierarchyParser.ts", () => {
  return {
    parseSkillHierarchyFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 600,
      rowsSuccess: 600,
      rowsFailed: 0,
    } as RowsProcessedStats),
  };
});

// Mock the SkillToSkillRelationParser
jest.mock("import/esco/skillToSkillRelation/skillToSkillRelationParser.ts", () => {
  return {
    parseSkillToSkillRelationFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 500,
      rowsSuccess: 500,
      rowsFailed: 0,
    } as RowsProcessedStats),
  };
});

// ##############
import { parseFiles } from "./parseFiles";
import ImportAPISpecs from "api-specifications/import";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { parseISCOGroupsFromUrl } from "import/esco/ISCOGroups/ISCOGroupsParser";
import { getUploadBucketName, getUploadBucketRegion } from "server/config/config";
import { S3PresignerService } from "./S3PresignerService";
import { parseSkillGroupsFromUrl } from "import/esco/skillGroups/skillGroupsParser";
import { parseSkillsFromUrl } from "import/esco/skills/skillsParser";
import { parseOccupationsFromUrl } from "import/esco/occupations/occupationsParser";
import { parseOccupationHierarchyFromUrl } from "import/esco/occupationHierarchy/occupationHierarchyParser";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ImportProcessStateAPISpec from "api-specifications/importProcessState";
import importLogger from "import/importLogger/importLogger";
import { parseSkillHierarchyFromUrl } from "import/esco/skillHierarchy/skillHierarchyParser";
import { parseSkillToSkillRelationFromUrl } from "import/esco/skillToSkillRelation/skillToSkillRelationParser";

// ##############

describe("Test the main async handler", () => {
  beforeAll(() => {
    jest.spyOn(importLogger, "logError");
    jest.spyOn(importLogger, "logWarning");
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should successfully parse all files", async () => {
    // GIVEN some configuration
    const givenUploadBucketRegion = getUploadBucketRegion();
    const givenUploadBucketName = getUploadBucketName();
    // AND the model to import into with a given modelId and a given importProcessStateId
    const givenModelId = getMockStringId(1);
    const givenImportProcessStateId = getMockStringId(2);
    const givenModelInfoRepositoryMock = {
      Model: undefined as any,
      create: jest.fn().mockResolvedValue(null),
      getModelById: jest.fn().mockResolvedValue({
        id: givenModelId,
        importProcessState: {
          id: givenImportProcessStateId,
        },
      }),
      getModelByUUID: jest.fn().mockResolvedValue(null),
      getModels: jest.fn().mockResolvedValue([]),
    };
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);
    // AND the importProcessState will be successfully created with an id that doesn't already exist in the db
    // AND the importProcessState will be successfully updated
    const givenImportProcessStateRepositoryMock = {
      Model: undefined as any,
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(null),
    };
    jest
      .spyOn(getRepositoryRegistry(), "importProcessState", "get")
      .mockReturnValue(givenImportProcessStateRepositoryMock);
    // AND an Import event
    const givenEvent: ImportAPISpecs.Types.POST.Request.Payload = {
      filePaths: {
        [ImportAPISpecs.Constants.ImportFileTypes.ISCO_GROUP]: "path/to/ISCO_GROUP.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUP]: "path/to/ESCO_SKILL_GROUP.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL]: "path/to/ESCO_SKILL.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_OCCUPATION]: "path/to/ESCO_OCCUPATION.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_HIERARCHY]: "path/to/OCCUPATION_HIERARCHY.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_HIERARCHY]: "path/to/ESCO_SKILL_HIERARCHY.csv",
        [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_SKILL_RELATIONS]: "path/to/ESCO_SKILL_SKILL_RELATIONS.csv",
        // ADD additional file types here
      },
      modelId: givenModelId,
    };

    // WHEN the handler is invoked with the given event param
    await parseFiles(givenEvent);

    // THEN expect the S3PresignerService to have been instantiated with the correct region and bucket name
    expect(S3PresignerService).toHaveBeenCalledWith(givenUploadBucketRegion, givenUploadBucketName);
    // AND expect the importProcessState to have been created with a status of RUNNING
    expect(getRepositoryRegistry().importProcessState.create).toHaveBeenCalledWith({
      id: givenImportProcessStateId,
      modelId: givenModelId,
      status: ImportProcessStateAPISpec.Enums.Status.RUNNING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      },
    });
    // AND for each of the givenEvent.filePaths to call the correct processing function with the giveModelId and the presigned URL for the file path
    for (const entry of Object.entries(givenEvent.filePaths)) {
      const expectedFileType = entry[0];
      const expectedPresignedUrl = await mockS3PresignerServiceInstance.getPresignedGet(entry[1]);
      switch (expectedFileType) {
        case ImportAPISpecs.Constants.ImportFileTypes.ISCO_GROUP:
          expect(parseISCOGroupsFromUrl).toHaveBeenCalledWith(
            givenEvent.modelId,
            expectedPresignedUrl,
            expect.any(Map)
          );
          break;
        case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUP:
          expect(parseSkillGroupsFromUrl).toHaveBeenCalledWith(
            givenEvent.modelId,
            expectedPresignedUrl,
            expect.any(Map)
          );
          break;
        case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL:
          expect(parseSkillsFromUrl).toHaveBeenCalledWith(givenEvent.modelId, expectedPresignedUrl, expect.any(Map));
          break;
        case ImportAPISpecs.Constants.ImportFileTypes.ESCO_OCCUPATION:
          expect(parseOccupationsFromUrl).toHaveBeenCalledWith(
            givenEvent.modelId,
            expectedPresignedUrl,
            expect.any(Map)
          );
          break;
        case ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_HIERARCHY:
          expect(parseOccupationHierarchyFromUrl).toHaveBeenCalledWith(
            givenEvent.modelId,
            expectedPresignedUrl,
            expect.any(Map)
          );
          break;
        case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_HIERARCHY:
          expect(parseSkillHierarchyFromUrl).toHaveBeenCalledWith(
            givenEvent.modelId,
            expectedPresignedUrl,
            expect.any(Map)
          );
          break;
        case ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_SKILL_RELATIONS:
          expect(parseSkillToSkillRelationFromUrl).toHaveBeenCalledWith(
            givenEvent.modelId,
            expectedPresignedUrl,
            expect.any(Map)
          );
          break;
        // ADD additional file types here
      }
      // AND expect the importProcessState to have been updated with a status of COMPLETED
      expect(getRepositoryRegistry().importProcessState.update).toHaveBeenCalledWith(givenImportProcessStateId, {
        status: ImportProcessStateAPISpec.Enums.Status.COMPLETED,
        result: {
          errored: false,
          parsingErrors: false,
          parsingWarnings: false,
        },
      });
    }
  });

  describe("should report parsing errors and parsing warning", () => {
    test.each([
      [
        "not report parsingWarnings or parsingErrors when the importLogger has not logged neither errors nor warnings",
        () => {
          jest.spyOn(importLogger, "errorCount", "get").mockReturnValueOnce(0);
          jest.spyOn(importLogger, "warningCount", "get").mockReturnValueOnce(0);
        },
        {
          errored: false,
          parsingErrors: false,
          parsingWarnings: false,
        },
      ],
      [
        "report parsingWarnings when the importLogger has logged a warning",
        () => {
          jest.spyOn(importLogger, "errorCount", "get").mockReturnValueOnce(0);
          jest.spyOn(importLogger, "warningCount", "get").mockReturnValueOnce(1);
        },
        {
          errored: false,
          parsingErrors: false,
          parsingWarnings: true,
        },
      ],
      [
        "report parsingErrors when the importLogger has logged an error",
        () => {
          jest.spyOn(importLogger, "errorCount", "get").mockReturnValueOnce(1);
          jest.spyOn(importLogger, "warningCount", "get").mockReturnValueOnce(0);
        },
        {
          errored: false,
          parsingErrors: true,
          parsingWarnings: false,
        },
      ],
      [
        "report parsingErrors and parsingWarnings when the importLogger has logged an error and a warning",
        () => {
          jest.spyOn(importLogger, "errorCount", "get").mockReturnValueOnce(1);
          jest.spyOn(importLogger, "warningCount", "get").mockReturnValueOnce(1);
        },
        {
          errored: false,
          parsingErrors: true,
          parsingWarnings: true,
        },
      ],
      [
        "report parsingWarnings when the occupations hierarchy has more or less rows than expected",
        () => {
          // AND the parser will parse a different number of occupation hierarchy rows than expected
          (parseISCOGroupsFromUrl as jest.Mock).mockResolvedValueOnce({
            rowsProcessed: 100,
            rowsSuccess: 100,
            rowsFailed: 0,
          } as RowsProcessedStats);
          (parseOccupationsFromUrl as jest.Mock).mockResolvedValueOnce({
            rowsProcessed: 200,
            rowsSuccess: 200,
            rowsFailed: 0,
          } as RowsProcessedStats);
          (parseOccupationHierarchyFromUrl as jest.Mock).mockResolvedValueOnce({
            rowsProcessed: 1, //<------- should have been 100 + 200 - 10
            rowsSuccess: 1, //<------- should have been 100 + 200 - 10
            rowsFailed: 0,
          } as RowsProcessedStats);
        },
        {
          errored: false,
          parsingErrors: false,
          parsingWarnings: true,
        },
      ],
    ])("should %s", async (desc, setupTestcaseCallBack, expectedResult) => {
      // GIVEN the model to import into with a given modelId and a given importProcessStateId
      const givenModelId = getMockStringId(1);
      const givenImportProcessStateId = getMockStringId(2);
      const givenModelInfoRepositoryMock = {
        Model: undefined as any,
        create: jest.fn().mockResolvedValue(null),
        getModelById: jest.fn().mockResolvedValue({
          id: givenModelId,
          importProcessState: {
            id: givenImportProcessStateId,
          },
        }),
        getModelByUUID: jest.fn().mockResolvedValue(null),
        getModels: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);
      // AND the importProcessState will be successfully created with an id that doesn't already exist in the db
      // AND the importProcessState will be successfully updated
      const givenImportProcessStateRepositoryMock = {
        Model: undefined as any,
        create: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(null),
      };
      jest
        .spyOn(getRepositoryRegistry(), "importProcessState", "get")
        .mockReturnValue(givenImportProcessStateRepositoryMock);
      // AND an Import event
      const givenEvent: ImportAPISpecs.Types.POST.Request.Payload = {
        filePaths: {
          [ImportAPISpecs.Constants.ImportFileTypes.ISCO_GROUP]: "path/to/ISCO_GROUP.csv",
          [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_GROUP]: "path/to/ESCO_SKILL_GROUP.csv",
          [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL]: "path/to/ESCO_SKILL.csv",
          [ImportAPISpecs.Constants.ImportFileTypes.ESCO_OCCUPATION]: "path/to/ESCO_OCCUPATION.csv",
          [ImportAPISpecs.Constants.ImportFileTypes.OCCUPATION_HIERARCHY]: "path/to/OCCUPATION_HIERARCHY.csv",
          [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_HIERARCHY]: "path/to/ESCO_SKILL_HIERARCHY.csv",
          [ImportAPISpecs.Constants.ImportFileTypes.ESCO_SKILL_SKILL_RELATIONS]:
            "path/to/ESCO_SKILL_SKILL_RELATIONS.csv",
          // ADD additional file types here
        },
        modelId: givenModelId,
      };
      // AND the parser will cause the importLogger to log an error or a warning
      setupTestcaseCallBack();

      // WHEN the handler is invoked with the given event param
      await parseFiles(givenEvent);

      // THEN expect the importProcessState to have been updated with a status of COMPLETED
      expect(getRepositoryRegistry().importProcessState.update).toHaveBeenCalledWith(givenImportProcessStateId, {
        status: ImportProcessStateAPISpec.Enums.Status.COMPLETED,
        // AND expect the importProcessState to have been updated with the expected import result
        result: expectedResult,
      });
    });
  });
});
