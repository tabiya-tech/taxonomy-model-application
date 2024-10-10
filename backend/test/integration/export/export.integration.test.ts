//mute chatty console
import "_test_utilities/consoleMock";
import "_test_utilities/mockSentry";

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
import * as OccupationGroupsToCSVTransformModule from "export/esco/occupationGroup/OccupationGroupsToCSVTransform";
import * as OccupationsToCSVTransform from "export/esco/occupation/OccupationsToCSVTransform";
import * as SkillsToCSVTransformModule from "export/esco/skill/SkillsToCSVTransform";
import * as SkillGroupsToCSVTransformModule from "export/esco/skillGroup/SkillGroupsToCSVTransform";
import * as OccupationHierarchyToCSVTransformModule from "export/esco/occupationHierarchy/occupationHierarchyToCSVTransform";
import * as SkillHierarchyToCSVTransformModule from "export/esco/skillHierarchy/skillHierarchyToCSVTransform";
import * as OccupationToSkillRelationToCSVTransformModule from "export/esco/occupationToSkillRelation/occupationToSkillRelationToCSVTransform";
import * as SkillToSkillRelationToCSVTransformModule from "export/esco/skillToSkillRelation/skillToSkillRelationToCSVTransform";
import * as ModelInfoToCSVTransformModule from "export/modelInfo/modelInfoToCSVTransform";
import * as CSVtoZipPipelineModule from "export/async/CSVtoZipPipeline";
import * as UploadZipToS3Module from "export/async/uploadZipToS3";
import archiver from "archiver";
import { getConnectionManager } from "server/connection/connectionManager";
import {
  getSampleOccupationGroupSpecs,
  getSampleOccupationHierarchy,
  getSampleESCOOccupationSpecs,
  getSampleLocalOccupationSpecs,
  getSampleOccupationToSkillRelations,
  getSampleSkillGroupsSpecs,
  getSampleSkillsHierarchy,
  getSampleSkillsSpecs,
  getSampleSkillToSkillRelations,
} from "./getSampleEntitiesArray";
import extract from "extract-zip";
import * as path from "path";
import {FILENAMES} from "export/async/modelToS3";
import {countCSVRecords} from "import/esco/_test_utilities/countCSVRecords";
import mongoose from "mongoose";
import {Context} from "aws-lambda";

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


  async function createTestModel(): Promise<{ modelId: string }> {

    // Construct a model
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "foo",
      locale: {
        UUID: randomUUID(),
        name: "bar",
        shortCode: "et",
      },
      description: "",
      UUIDHistory: [randomUUID()],
    });

    // AND occupationOccupationGroups exist for that model
    const actualOccupationgroups = await getRepositoryRegistry().OccupationGroup.createMany(getSampleOccupationGroupSpecs(givenModel.id));

    // AND ESCO Occupations
    const actualEscoOccupations = await getRepositoryRegistry().occupation.createMany(
      getSampleESCOOccupationSpecs(givenModel.id)
    );
    // guard to ensure that test data where generated
    expect(actualEscoOccupations.length).toBeGreaterThan(0);

    // AND Local Occupations
    const actualLocalOccupations = await getRepositoryRegistry().occupation.createMany(
      getSampleLocalOccupationSpecs(givenModel.id)
    );
    // guard to ensure that test data where generated
    expect(actualLocalOccupations.length).toBeGreaterThan(0);

    // AND Skills
    const actualSkills = await getRepositoryRegistry().skill.createMany(getSampleSkillsSpecs(givenModel.id));
    // guard to ensure that test data where generated
    expect(actualSkills.length).toBeGreaterThan(0);

    // AND SkillGroups
    const actualSkillGroups = await getRepositoryRegistry().skillGroup.createMany(
      getSampleSkillGroupsSpecs(givenModel.id)
    );
    // guard to ensure that test data where generated
    expect(actualSkillGroups.length).toBeGreaterThan(0);

    // AND occupationHierarchy
    const actualOccupationHierarchy = await getRepositoryRegistry().occupationHierarchy.createMany(
      givenModel.id,
      getSampleOccupationHierarchy(actualOccupationgroups, actualEscoOccupations, actualLocalOccupations)
    );
    // guard to ensure that test data where generated
    expect(actualOccupationHierarchy.length).toBeGreaterThan(0);

    // AND skillHierarchy
    const actualSkillHierarchy = await getRepositoryRegistry().skillHierarchy.createMany(
      givenModel.id,
      getSampleSkillsHierarchy(actualSkills, actualSkillGroups)
    );
    // guard to ensure that test data where generated
    expect(actualSkillHierarchy.length).toBeGreaterThan(0);

    // AND occupationToSkillRelations
    // combine the occupations from both sources and sort them randomly
    const actualOccupations = actualEscoOccupations.concat(actualLocalOccupations).sort(() => Math.random() - 0.5);
    const actualOccupationToSkillRelations = await getRepositoryRegistry().occupationToSkillRelation.createMany(
      givenModel.id,
      getSampleOccupationToSkillRelations(actualOccupations, actualSkills)
    );
    // guard to ensure that test data where generated
    expect(actualOccupationToSkillRelations.length).toBeGreaterThan(0);

    // AND skillToSkillRelations
    const actualSkillToSkillRelations = await getRepositoryRegistry().skillToSkillRelation.createMany(
      givenModel.id,
      getSampleSkillToSkillRelations(actualSkills)
    );
    // guard to ensure that test data where generated
    expect(actualSkillToSkillRelations.length).toBeGreaterThan(0);

    return { modelId: givenModel.id };
  }

  test("export to file", async () => {
    // For each Collection exported
    jest.spyOn(OccupationGroupsToCSVTransformModule, "default");
    jest.spyOn(OccupationsToCSVTransform, "default");
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
    const { modelId } = await createTestModel();
    // guard to ensure that no error has occurred while creating the test data
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND an export process is pending for that model
    const givenExportProcessState = await getRepositoryRegistry().exportProcessState.create({
      modelId: modelId,
      status: ExportProcessStateApiSpecs.Enums.Status.PENDING,
      result: {
        errored: false,
        exportErrors: false,
        exportWarnings: false,
      },
      downloadUrl: "https://example.com/" + randomUUID(),
      timestamp: new Date(),
    });
    // guard to ensure that the export process state was created
    expect(givenExportProcessState.id).toBeDefined();

    // AND async event for that model and process
    const givenAsyncExportEvent: AsyncExportEvent = {
      modelId: modelId,
      exportProcessStateId: givenExportProcessState.id,
    };
    // AND a context object
    const givenContext: Context = {
        functionName: "foo",
        functionVersion: "bar",
        invokedFunctionArn: "baz",
      } as unknown as Context;
    // AND a callback function
    const givenCallback = jest.fn();
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
    const handlerPromise = handler(givenAsyncExportEvent, givenContext, givenCallback);

    // THEN the handler should resolve successfully
    await expect(handlerPromise).resolves.toBe(undefined);

    // AND the export process state should be updated to COMPLETED without errors
    const actualExportProcessState = await getRepositoryRegistry().exportProcessState.findById(givenExportProcessState.id);
    expect(actualExportProcessState).toMatchObject({
      id: givenExportProcessState.id,
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

    // AND assert the content of the zip file
    const zipFile = "./tmp/" + actualExportProcessState!.downloadUrl.split("/").pop();
    const extractFolder = path.resolve(zipFile.replace(".zip", ""));
    await extract(zipFile, { dir: extractFolder });

    // AND assert the content of the extracted files
    await assertCollectionExportedSuccessfully(getRepositoryRegistry().OccupationGroup.Model, path.join(extractFolder, FILENAMES.OccupationGroups));
    await assertCollectionExportedSuccessfully(getRepositoryRegistry().occupation.Model, path.join(extractFolder, FILENAMES.Occupations));
    await assertCollectionExportedSuccessfully(getRepositoryRegistry().skill.Model, path.join(extractFolder, FILENAMES.Skills));
    await assertCollectionExportedSuccessfully(getRepositoryRegistry().skillGroup.Model, path.join(extractFolder, FILENAMES.SkillGroups));
    await assertCollectionExportedSuccessfully(getRepositoryRegistry().occupationHierarchy.hierarchyModel, path.join(extractFolder, FILENAMES.OccupationHierarchy));
    await assertCollectionExportedSuccessfully(getRepositoryRegistry().skillHierarchy.hierarchyModel, path.join(extractFolder, FILENAMES.SkillHierarchy));
    await assertCollectionExportedSuccessfully(getRepositoryRegistry().occupationToSkillRelation.relationModel, path.join(extractFolder, FILENAMES.OccupationToSkillRelations));
    await assertCollectionExportedSuccessfully(getRepositoryRegistry().skillToSkillRelation.relationModel, path.join(extractFolder, FILENAMES.SkillToSkillRelations));
    await assertCollectionExportedSuccessfully(getRepositoryRegistry().modelInfo.Model, path.join(extractFolder, FILENAMES.ModelInfo));

    // AND All resources have been released
    await assertThanAllResourcesAreReleased();
  });
});


const assertCollectionExportedSuccessfully = async (
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: mongoose.Model<any>,
  fileName: string
) => {
  const csvRowCount = countCSVRecords(fileName);
  const dbRowCount = await model.countDocuments({});
  expect(csvRowCount).toBeGreaterThan(0);
  expect(dbRowCount).toBeGreaterThan(0);
  expect(csvRowCount).toEqual(dbRowCount);
};

async function assertStreamIsClosedAndDestroyed(stream: Readable) {
  await new Promise((resolve) =>
    setImmediate(() => resolve("Flush all micro tasks so that the close events can be emitted and consumed."))
  );
  expect(stream.closed).toBe(true);
  expect(stream.destroyed).toBe(true);
}

async function assertThanAllResourcesAreReleased() {
  // Assert all the CSVtoZipPipeline stream resources are released
  for await (const result of (CSVtoZipPipelineModule.default as jest.Mock).mock.results) {
    const CSVtoZipPipelineStream = result.value as Readable;
    await assertStreamIsClosedAndDestroyed(CSVtoZipPipelineStream);
  }

  // Assert UploadZipToS3 (passThrough) to be cleaned up
  const sourceUploadStream = (UploadZipToS3Module.default as jest.Mock).mock.calls[0][0] as Readable;
  await assertStreamIsClosedAndDestroyed(sourceUploadStream);

  // Assert the actualZipper is destroyed
  // The archiver does not have a closed property, so we need to check only the destroyed property
  const actualZipper: archiver.Archiver = (archiver.create as jest.Mock).mock.results[0].value;
  expect(actualZipper.destroyed).toBe(true);

  // For each Collection in the DB
  // Assert stream resources are released
  for (const module of [
    OccupationGroupsToCSVTransformModule.default,
    OccupationsToCSVTransform.default,
    SkillsToCSVTransformModule.default,
    SkillGroupsToCSVTransformModule.default,
    OccupationHierarchyToCSVTransformModule.default,
    SkillHierarchyToCSVTransformModule.default,
    OccupationToSkillRelationToCSVTransformModule.default,
    SkillToSkillRelationToCSVTransformModule.default,
    ModelInfoToCSVTransformModule.default,
  ]) {
     const stream = await ((module as jest.Mock).mock.results[0].value) as Readable;
    await assertStreamIsClosedAndDestroyed(stream);
  }
}
