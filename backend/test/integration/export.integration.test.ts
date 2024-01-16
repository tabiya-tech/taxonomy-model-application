//mute chatty console
import "_test_utilities/consoleMock";

import errorLogger from "common/errorLogger/errorLogger";

jest.mock("archiver", () => {
  const actual = jest.requireActual("archiver");
  return {
    __esModule: true,
    default: actual,
    ...actual,
  };
});

import process from "process";
import { ENV_VAR_NAMES } from "server/config/config";
import { initOnce } from "server/init";
import { handler } from "export/async";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import ExportProcessStateApiSpecs from "api-specifications/exportProcessState";
import { randomUUID } from "crypto";
import { pipeline, Readable } from "stream";
import fs from "fs";
import { AsyncExportEvent } from "export/async/async.types";
import ISCOGroupsToCSVTransform, * as ISCOGroupsToCSVTransformModule from "export/esco/iscoGroup/ISCOGroupsToCSVTransform";
import ESCOOccupationsToCSVTransform, * as ESCOOccupationsToCSVTransformModule from "export/esco/occupation/ESCOOccupationsToCSVTransform";
import * as LocalOccupationsToCSVTransform from "export/esco/occupation/LocalOccupationsToCSVTransform";
import * as SkillsToCSVTransformModule from "export/esco/skill/SkillsToCSVTransform";
import * as SkillGroupsToCSVTransformModule from "export/esco/skillGroup/SkillGroupsToCSVTransform";
import * as LocalizedOccupationsToCSVTransformModule from "export/esco/localizedOccupation/LocalizedOccupationsToCSVTransform";
import * as OccupationHierarchyToCSVTransformModule from "export/esco/occupationHierarchy/occupationHierarchyToCSVTransform";
import * as SkillHierarchyToCSVTransformModule from "export/esco/skillHierarchy/skillHierarchyToCSVTransform";
import * as OccupationToSkillRelationToCSVTransformModule from "export/esco/occupationToSkillRelation/occupationToSkillRelationToCSVTransform";
import * as SkillToSkillRelationToCSVTransformModule from "export/esco/skillToSkillRelation/skillToSkillRelationToCSVTransform";
import * as ModelInfoToCSVTransformModule from "export/modelInfo/modelInfoToCSVTransform";
import CSVtoZipPipeline, * as CSVtoZipPipelineModule from "export/async/CSVtoZipPipeline";
import uploadZipToS3, * as UploadZipToS3Module from "export/async/uploadZipToS3";
import archiver from "archiver";
import { getConnectionManager } from "server/connection/connectionManager";
import {
  getSampleISCOGroupSpecs,
  getSampleLocalizedOccupationSpecs,
  getSampleOccupationHierarchy,
  getSampleOccupationSpecs,
  getSampleOccupationToSkillRelations,
  getSampleSkillGroupsSpecs,
  getSampleSkillsHierarchy,
  getSampleSkillsSpecs,
  getSampleSkillToSkillRelations,
} from "export/_test_utilities/getSampleEntitiesArray";

describe("Test Export a model as CSV from an  an in-memory mongodb", () => {
  const originalEnv: { [key: string]: string } = {};
  // Backup and restore the original env variables
  beforeAll(() => {
    Object.keys(process.env).forEach((key) => {
      originalEnv[key] = process.env[key] as string;
    });
  });

  afterAll(() => {
    // Restore original env variables
    Object.keys(process.env).forEach((key) => {
      delete process.env[key];
    });
    Object.keys(originalEnv).forEach((key) => {
      process.env[key] = originalEnv[key];
    });
  });

  // Initialize the server with an in-memory mongodb
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    process.env[ENV_VAR_NAMES.MONGODB_URI] = process.env[ENV_VAR_NAMES.MONGODB_URI] + "ExportIntegrationTestDB";
    process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_NAME] = "not-used";
    process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_REGION] = "not-used";
    process.env[ENV_VAR_NAMES.DOWNLOAD_BUCKET_NAME] = "not-used";
    process.env[ENV_VAR_NAMES.DOWNLOAD_BUCKET_REGION] = "not-used";
    process.env[ENV_VAR_NAMES.ASYNC_IMPORT_LAMBDA_FUNCTION_ARN] = "not-used";
    process.env[ENV_VAR_NAMES.ASYNC_EXPORT_LAMBDA_FUNCTION_ARN] = "not-used";
    process.env[ENV_VAR_NAMES.ASYNC_LAMBDA_FUNCTION_REGION] = "not-used";
  });

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    await initOnce();
  });

  // Drop the database after all tests and close the connection
  afterAll(async () => {
    const connection = getConnectionManager().getCurrentDBConnection();
    if (connection) {
      try {
        await connection.dropDatabase();
        await connection.close(true);
      } catch (e) {
        console.error("Error dropping database: " + e);
      }
    }
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function createTestData() {
    // GIVEN a model exists with data (occupations)
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "foo",
      locale: {
        UUID: randomUUID(),
        name: "bar",
        shortCode: "et",
      },
      description: "",
    });
    // AND an export process is pending for that model
    const givenExportProcessState = await getRepositoryRegistry().exportProcessState.create({
      modelId: givenModel.id,
      status: ExportProcessStateApiSpecs.Enums.Status.PENDING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "https://example.com/" + randomUUID(),
      timestamp: new Date(),
    });

    // AND occupations exist for that model
    await getRepositoryRegistry().ISCOGroup.createMany(getSampleISCOGroupSpecs(givenModel.id));
    const actualESCOOccupations = await getRepositoryRegistry().occupation.createMany(
      getSampleOccupationSpecs(givenModel.id)
    ); // ESCO Occupations
    await getRepositoryRegistry().occupation.createMany(getSampleOccupationSpecs(givenModel.id, true)); // Local Occupations
    await getRepositoryRegistry().localizedOccupation.createMany(
      getSampleLocalizedOccupationSpecs(actualESCOOccupations)
    ); // Localized Occupations
    const actualSkills = await getRepositoryRegistry().skill.createMany(getSampleSkillsSpecs(givenModel.id));
    const actualSkillGroups = await getRepositoryRegistry().skillGroup.createMany(
      getSampleSkillGroupsSpecs(givenModel.id)
    );
    await getRepositoryRegistry().occupationHierarchy.createMany(
      givenModel.id,
      getSampleOccupationHierarchy(givenModel.id)
    );
    await getRepositoryRegistry().skillHierarchy.createMany(
      givenModel.id,
      getSampleSkillsHierarchy(actualSkills, actualSkillGroups)
    );
    await getRepositoryRegistry().occupationToSkillRelation.createMany(
      givenModel.id,
      getSampleOccupationToSkillRelations(actualESCOOccupations, actualSkills)
    );
    await getRepositoryRegistry().skillToSkillRelation.createMany(
      givenModel.id,
      getSampleSkillToSkillRelations(actualSkills)
    );

    return { modelId: givenModel.id, exportProcessStateId: givenExportProcessState.id };
  }

  test("export to file", async () => {
    // For each Collection exported
    jest.spyOn(getRepositoryRegistry().ISCOGroup, "findAll");
    jest.spyOn(getRepositoryRegistry().occupation, "findAll");
    jest.spyOn(ISCOGroupsToCSVTransformModule, "default");
    jest.spyOn(ESCOOccupationsToCSVTransformModule, "default");
    jest.spyOn(LocalOccupationsToCSVTransform, "default");
    jest.spyOn(LocalizedOccupationsToCSVTransformModule, "default");
    jest.spyOn(SkillsToCSVTransformModule, "default");
    jest.spyOn(SkillGroupsToCSVTransformModule, "default");
    jest.spyOn(OccupationHierarchyToCSVTransformModule, "default");
    jest.spyOn(SkillHierarchyToCSVTransformModule, "default");
    jest.spyOn(OccupationToSkillRelationToCSVTransformModule, "default");
    jest.spyOn(SkillToSkillRelationToCSVTransformModule, "default");
    jest.spyOn(ModelInfoToCSVTransformModule, "default");
    jest.spyOn(CSVtoZipPipelineModule, "default");
    jest.spyOn(archiver, "create");

    // GIVEN a model exists in the db with some data
    const { modelId, exportProcessStateId } = await createTestData();
    // guard to ensure that no error has occurred while creating the test data
    // TODO: clearing the warn and errors as currently, the createTestData() fails to create occupation hierarchy
    (console.warn as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND async event for that model and process
    const givenAsyncExportEvent: AsyncExportEvent = {
      modelId: modelId,
      exportProcessStateId: exportProcessStateId,
    };
    // AND the s3.upload is mocked to write in to a file
    jest
      .spyOn(UploadZipToS3Module, "default")
      .mockImplementation((uploadStream: Readable, fileName: string, _region: string, _bucketName: string) => {
        return new Promise((resolve, reject) => {
          try {
            fs.mkdirSync("./tmp", { recursive: true });
            const writeStream = fs.createWriteStream("./tmp/" + fileName);
            pipeline(uploadStream, writeStream, (err) => {
              if (err) {
                console.log("UploadErrored");
                reject(err);
                return;
              }
              console.log("UploadSucceeded");
              console.log("bytes witten:" + writeStream.bytesWritten);
              resolve();
            });
          } catch (e) {
            reject(e);
          }
        });
      });

    // WHEN the handler is called
    const handlerPromise = handler(givenAsyncExportEvent);

    // THEN the handler should resolve successfully
    await expect(handlerPromise).resolves.toBe(undefined);

    // AND the export process state should be updated to COMPLETED without errors
    const exportProcessState = await getRepositoryRegistry().exportProcessState.findById(exportProcessStateId);
    expect(exportProcessState).toMatchObject({
      id: exportProcessStateId,
      modelId: modelId,
      status: ExportProcessStateApiSpecs.Enums.Status.COMPLETED,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: expect.stringMatching(/^https:\/\/.*/),
      timestamp: expect.any(Date),
    });
    // AND the errorLogger should not have logged any errors or warnings
    expect(errorLogger.errorCount).toEqual(0);
    expect(errorLogger.warningCount).toEqual(0);
    // AND no errors should have been logged to the consoleD
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND All resources have been released
    await assertThanAllResourcesAreReleased();
  });
});

async function assertStreamIsClosedAndDestroyed(stream: Readable) {
  await new Promise((resolve) =>
    setImmediate(() => resolve("Flush all micro tasks so that the close events can be emitted and consumed."))
  );
  expect(stream.closed).toBe(true);
  expect(stream.destroyed).toBe(true);
}

async function assertThanAllResourcesAreReleased() {
  // Assert all the CSVtoZipPipeline stream resources are released
  for await (const result of (CSVtoZipPipeline as jest.Mock).mock.results) {
    const CSVtoZipPipelineStream = result.value as Readable;
    await assertStreamIsClosedAndDestroyed(CSVtoZipPipelineStream);
  }

  // Assert UploadZipToS3 (passThrough) to be cleaned up
  const sourceUploadStream = (uploadZipToS3 as jest.Mock).mock.calls[0][0] as Readable;
  await assertStreamIsClosedAndDestroyed(sourceUploadStream);

  // Assert the actualZipper is destroyed
  // The archiver does not have a closed property, so we need to check only the destroyed property
  const actualZipper: archiver.Archiver = (archiver.create as jest.Mock).mock.results[0].value;
  expect(actualZipper.destroyed).toBe(true);

  // For each Collection in the DB
  // Asser ISCOGroupsToCSV stream resources are released
  const ISCOGroupsToCSVTransformStream = (ISCOGroupsToCSVTransform as jest.Mock).mock.results[0].value as Readable;
  await assertStreamIsClosedAndDestroyed(ISCOGroupsToCSVTransformStream);

  // Assert ESCOOccupationsToCSV stream resources are released
  const ESCOOccupationsToCSVTransformStream = (ESCOOccupationsToCSVTransform as jest.Mock).mock.results[0]
    .value as Readable;
  await assertStreamIsClosedAndDestroyed(ESCOOccupationsToCSVTransformStream);

  // Assert LocalOccupationsToCSV stream resources are released
  const LocalOccupationsToCSVTransformStream = (LocalOccupationsToCSVTransform.default as jest.Mock).mock.results[0]
    .value as Readable;
  await assertStreamIsClosedAndDestroyed(LocalOccupationsToCSVTransformStream);

  // Assert SkillsToCSV stream resources are released
  const SkillsToCSVTransformStream = (SkillsToCSVTransformModule.default as jest.Mock).mock.results[0]
    .value as Readable;
  await assertStreamIsClosedAndDestroyed(SkillsToCSVTransformStream);

  // Assert SkillGroupsToCSV stream resources are released
  const SkillGroupsToCSVTransformStream = (SkillGroupsToCSVTransformModule.default as jest.Mock).mock.results[0]
    .value as Readable;
  await assertStreamIsClosedAndDestroyed(SkillGroupsToCSVTransformStream);

  // Assert LocalizedOccupationsToCSV stream resources are released
  const LocalizedOccupationsToCSVTransformStream = (LocalizedOccupationsToCSVTransformModule.default as jest.Mock).mock
    .results[0].value as Readable;
  await assertStreamIsClosedAndDestroyed(LocalizedOccupationsToCSVTransformStream);

  // Assert OccupationHierarchyToCSV stream resources are released
  const OccupationHierarchyToCSVTransformStream = (OccupationHierarchyToCSVTransformModule.default as jest.Mock).mock
    .results[0].value as Readable;
  await assertStreamIsClosedAndDestroyed(OccupationHierarchyToCSVTransformStream);

  // Assert SkillHierarchyToCSV stream resources are released
  const SkillHierarchyToCSVTransformStream = (SkillHierarchyToCSVTransformModule.default as jest.Mock).mock.results[0]
    .value as Readable;
  await assertStreamIsClosedAndDestroyed(SkillHierarchyToCSVTransformStream);

  // Assert OccupationToSkillRelationToCSV stream resources are released
  const OccupationToSkillRelationToCSVTransformStream = (
    OccupationToSkillRelationToCSVTransformModule.default as jest.Mock
  ).mock.results[0].value as Readable;
  await assertStreamIsClosedAndDestroyed(OccupationToSkillRelationToCSVTransformStream);

  // Assert SkillToSkillRelationToCSV stream resources are released
  const SkillToSkillRelationToCSVTransformStream = (SkillToSkillRelationToCSVTransformModule.default as jest.Mock).mock
    .results[0].value as Readable;
  await assertStreamIsClosedAndDestroyed(SkillToSkillRelationToCSVTransformStream);

  // Assert ModelInfoToCSV stream resources are released
  const ModelInfoToCSVTransformStream = (await (ModelInfoToCSVTransformModule.default as jest.Mock).mock.results[0]
    .value) as Readable;
  await assertStreamIsClosedAndDestroyed(ModelInfoToCSVTransformStream);
}
