//mute console.log
import "_test_utilities/consoleMock";

// Mock the configuration
jest.mock("server/config/config", () => {
  const mockConfiguration = {
    dbURI: "mongodb://username@password:server:port/database", resourcesBaseUrl: "https://path/to/resource", uploadBucketName: "bucket name", uploadBucketRegion: "bucket region", asyncLambdaFunctionRegion: "async function region", asyncLambdaFunctionArn: "function arn"
  }
  return {
    getUploadBucketName: jest.fn().mockImplementation(() => {
      return mockConfiguration.uploadBucketName;
    }), getUploadBucketRegion: jest.fn().mockImplementation(() => {
      return mockConfiguration.uploadBucketRegion;
    }),
  }
});

// Mock the S3PresignerService
const mockS3PresignerServiceInstance = {
  getPresignedGet: jest.fn().mockImplementation((filePath: string) => {
    return Promise.resolve(`presigned url for ${filePath}`);
  })
};

jest.mock('./S3PresignerService', () => {
  return {
    S3PresignerService: jest.fn().mockReturnValue(mockS3PresignerServiceInstance)
  };
});

// Mock the ISCOGroupsParser
jest.mock("import/esco/ISCOGroups/ISCOGroupsParser", () => {
  return {
    parseISCOGroupsFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 1, rowsSuccess: 1, rowsFailed: 0,
    } as RowsProcessedStats)
  }
});
// Mock the ESCOSkillGroupsParser
jest.mock("import/esco/skillGroups/skillGroupsParser.ts", () => {
  return {
    parseSkillGroupsFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 1, rowsSuccess: 1, rowsFailed: 0,
    } as RowsProcessedStats)
  }
});

// Mock the ESCOSkillParser
jest.mock("import/esco/skills/skillsParser.ts", () => {
  return {
    parseSkillsFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 1, rowsSuccess: 1, rowsFailed: 0,
    } as RowsProcessedStats)
  }
});

// Mock the OccupationsParser
jest.mock("import/esco/occupations/occupationsParser.ts", () => {
  return {
    parseOccupationsFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 1, rowsSuccess: 1, rowsFailed: 0,
    } as RowsProcessedStats)
  }
});

// Mock the OccupationHierarchyParser
jest.mock("import/esco/occupationHierarchy/occupationHierarchyParser.ts", () => {
  return {
    parseOccupationHierarchyFromUrl: jest.fn<Promise<RowsProcessedStats>, any>().mockResolvedValue({
      rowsProcessed: 1, rowsSuccess: 1, rowsFailed: 0,
    } as RowsProcessedStats)
  }
});

// ##############
import {parseFiles} from "./parseFiles";
import Import from "api-specifications/import";
import {getMockId} from "_test_utilities/mockMongoId";
import {parseISCOGroupsFromUrl} from "import/esco/ISCOGroups/ISCOGroupsParser";
import {getUploadBucketName, getUploadBucketRegion} from "server/config/config";
import {S3PresignerService} from "./S3PresignerService";
import {parseSkillGroupsFromUrl} from "import/esco/skillGroups/skillGroupsParser";
import {parseSkillsFromUrl} from "import/esco/skills/skillsParser";
import {parseOccupationsFromUrl} from "import/esco/occupations/occupationsParser";
import {parseOccupationHierarchyFromUrl} from "import/esco/occupationHierarchy/occupationHierarchyParser";
import {RowsProcessedStats} from "import/rowsProcessedStats.types";
import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegistry";
import ImportProcessStateAPISpec from "api-specifications/importProcessState"

// ##############

describe("Test the main async handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  })
  test("should successfully parse all files", async () => {
    // GIVEN some configuration
    const givenUploadBucketRegion = getUploadBucketRegion();
    const givenUploadBucketName = getUploadBucketName();
    // AND the model to import into with a given modelId and a given importProcessStateId
    const givenModelId = getMockId(1);
    const givenImportProcessStateId = getMockId(2);
    const givenModelInfoRepositoryMock = {
      Model: undefined as any, create: jest.fn().mockResolvedValue(null), getModelById: jest.fn().mockResolvedValue({
        id: givenModelId, importProcessState: {
          id: givenImportProcessStateId,
        }
      }), getModelByUUID: jest.fn().mockResolvedValue(null), getModels: jest.fn().mockResolvedValue([])
    };
    jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);
    // AND the importProcessState will be successfully created with an id that doesn't already exist in the db
    // AND the importProcessState will be successfully updated
    const givenImportProcessStateRepositoryMock = {
      Model: undefined as any, create: jest.fn().mockResolvedValue(null), update: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockResolvedValue(null)
    }
    jest.spyOn(getRepositoryRegistry(), "importProcessState", "get").mockReturnValue(givenImportProcessStateRepositoryMock);
    // AND an Import
    const givenEvent: Import.POST.Request.Payload = {
      filePaths: {
        [Import.Constants.ImportFileTypes.ISCO_GROUP]: "path/to/ISCO_GROUP.csv",
        [Import.Constants.ImportFileTypes.ESCO_SKILL_GROUP]: "path/to/ESCO_SKILL_GROUP.csv",
        [Import.Constants.ImportFileTypes.ESCO_SKILL]: "path/to/ESCO_SKILL.csv",
        [Import.Constants.ImportFileTypes.ESCO_OCCUPATION]: "path/to/ESCO_OCCUPATION.csv",
        [Import.Constants.ImportFileTypes.OCCUPATION_HIERARCHY]: "path/to/OCCUPATION_HIERARCHY.csv",

        // ADD additional file types here
      }, modelId: givenModelId
    };

    // WHEN the handler is invoked with the given event param
    await parseFiles(givenEvent);

    // THEN expect the S3PresignerService to have been instantiated with the correct region and bucket name
    expect(S3PresignerService).toHaveBeenCalledWith(givenUploadBucketRegion, givenUploadBucketName);
    // AND expect the importProcessState to have been created with a status of RUNNING
    expect(getRepositoryRegistry().importProcessState.create).toHaveBeenCalledWith({id: givenImportProcessStateId, modelId: givenModelId, status: ImportProcessStateAPISpec.Enums.Status.RUNNING, result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      }});
    // AND for each of the givenEvent.filePaths to call the correct processing function with the giveModelId and the presigned URL for the file path
    for (const entry of Object.entries(givenEvent.filePaths)) {
      const expectedFileType = entry[0];
      const expectedPresignedUrl = await mockS3PresignerServiceInstance.getPresignedGet(entry[1]);
      switch (expectedFileType) {
        case  Import.Constants.ImportFileTypes.ISCO_GROUP:
          expect(parseISCOGroupsFromUrl).toHaveBeenCalledWith(givenEvent.modelId, expectedPresignedUrl, expect.any(Map));
          break;
        case Import.Constants.ImportFileTypes.ESCO_SKILL_GROUP:
          expect(parseSkillGroupsFromUrl).toHaveBeenCalledWith(givenEvent.modelId, expectedPresignedUrl, expect.any(Map));
          break;
        case Import.Constants.ImportFileTypes.ESCO_SKILL:
          expect(parseSkillsFromUrl).toHaveBeenCalledWith(givenEvent.modelId, expectedPresignedUrl, expect.any(Map));
          break;
        case Import.Constants.ImportFileTypes.ESCO_OCCUPATION:
          expect(parseOccupationsFromUrl).toHaveBeenCalledWith(givenEvent.modelId, expectedPresignedUrl, expect.any(Map));
          break;
        case Import.Constants.ImportFileTypes.OCCUPATION_HIERARCHY:
          expect(parseOccupationHierarchyFromUrl).toHaveBeenCalledWith(givenEvent.modelId, expectedPresignedUrl, expect.any(Map));
          break;
        // ADD additional file types here
      }
      // AND expect the importProcessState to have been updated with a status of COMPLETED
       expect(getRepositoryRegistry().importProcessState.update).toHaveBeenCalledWith(
         givenImportProcessStateId,
         {
           status: ImportProcessStateAPISpec.Enums.Status.COMPLETED,
           result: {
             errored: false,
             parsingErrors: false,
             parsingWarnings: false,
        }
     });
    }
  })
});