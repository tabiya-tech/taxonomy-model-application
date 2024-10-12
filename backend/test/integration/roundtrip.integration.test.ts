//mute console.log
import "_test_utilities/consoleMock";
import "_test_utilities/mockSentry";

import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import * as process from "process";
import { ENV_VAR_NAMES } from "server/config/config";
import { parse } from "csv-parse/sync";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { randomUUID } from "crypto";
import { parseOccupationGroupsFromFile } from "import/esco/OccupationGroups/OccupationGroupsParser";
import { parseSkillGroupsFromFile } from "import/esco/skillGroups/skillGroupsParser";
import { parseSkillsFromFile } from "import/esco/skills/skillsParser";
import { parseOccupationsFromFile } from "import/esco/occupations/occupationsParser";
import { parseOccupationHierarchyFromFile } from "import/esco/occupationHierarchy/occupationHierarchyParser";
import { IModelInfo } from "modelInfo/modelInfo.types";
import errorLogger from "common/errorLogger/errorLogger";
import { parseSkillHierarchyFromFile } from "import/esco/skillHierarchy/skillHierarchyParser";
import { parseSkillToSkillRelationFromFile } from "import/esco/skillToSkillRelation/skillToSkillRelationParser";
import { parseOccupationToSkillRelationFromFile } from "import/esco/occupationToSkillRelation/occupationToSkillRelationParser";
import { AsyncExportEvent } from "export/async/async.types";
import * as UploadZipToS3Module from "export/async/uploadZipToS3";
import { pipeline, Readable } from "stream";
import fs from "fs";
import { handler } from "export/async";
import path from "path";
import extract from "extract-zip";
import ExportProcessStateApiSpecs from "api-specifications/exportProcessState";
import { arrayFromString } from "common/parseNewLineSeparateArray/parseNewLineSeparatedArray";
import { CSVObjectTypes } from "esco/common/csvObjectTypes";
import { Context } from "aws-lambda";

enum DataTestType {
  SAMPLE = "SAMPLE",
  ESCO = "ESCO",
}

describe("Test Roundtrip with an in-memory mongodb", () => {
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
  beforeEach(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    process.env[ENV_VAR_NAMES.MONGODB_URI] = process.env[ENV_VAR_NAMES.MONGODB_URI] + "CSVImportIntegrationTestDB";
    process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_NAME] = "not-used";
    process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_REGION] = "not-used";
    process.env[ENV_VAR_NAMES.DOWNLOAD_BUCKET_NAME] = "not-used";
    process.env[ENV_VAR_NAMES.DOWNLOAD_BUCKET_REGION] = "not-used";
    process.env[ENV_VAR_NAMES.ASYNC_IMPORT_LAMBDA_FUNCTION_ARN] = "not-used";
    process.env[ENV_VAR_NAMES.ASYNC_EXPORT_LAMBDA_FUNCTION_ARN] = "not-used";
    process.env[ENV_VAR_NAMES.ASYNC_LAMBDA_FUNCTION_REGION] = "not-used";
    await initOnce();
  });

  // Drop the database after all tests and close the connection
  afterAll(async () => {
    const connection = getConnectionManager().getCurrentDBConnection();
    if (connection) {
      try {
        await connection.dropDatabase();
        await connection.close(true);
      } catch (e: unknown) {
        console.error("Error dropping database: " + e);
      }
    }
  });

  afterEach(async () => {
    const connection = getConnectionManager().getCurrentDBConnection();
    await connection?.dropDatabase();
  });

  beforeEach(() => {
    // reset the error logger and the console spies
    errorLogger.clear();
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });
  // Uncomment the lines to run additional tests locally, but do not commit them as they take significant time to run.
  // The full ESCO data with a two-pass roundtrip import, takes up to 3 minutes to complete (or longer)
  // For this reason we run the one-pass roundtrip full ESCO test and the two-pass samples test on GitHub.
  test.each([
    [DataTestType.ESCO, false, "../data-sets/csv/tabiya-esco-v1.1.1/"],
    //[DataTestType.SAMPLE, false , "../data-sets/csv/tabiya-sample/"],
    //[DataTestType.ESCO, true , "../data-sets/csv/tabiya-esco-v1.1.1/"],
    [DataTestType.SAMPLE, true, "../data-sets/csv/tabiya-sample/"],
  ])(
    "should [CSV -Import-> DB -Export-> CSV | optional second pass: %s | 0 DB -Export-> CSV] for %s data test type",
    async (_dataTestType, doTwoPasses, sourceFolder) => {
      // First pass
      // 1.1 Import the original CSV files into the database
      const firstImportedModel = await doImport(sourceFolder);
      // 1.2 Export the data from the database into CSV files
      const exportFolderFirst = await doExport(firstImportedModel.id);
      // 1.3 Assert that the exported CSV files have the same content as the imported CSV files from 1.1
      await assertCSVFilesHaveTheSameContent(sourceFolder, exportFolderFirst, firstImportedModel);
      // Second pass
      if (!doTwoPasses) {
        return;
      }
      // 2.1 Import the exported CSV files from 1.2 into the database
      const secondImportedModel = await doImport(exportFolderFirst);
      // 2.2 Export the data from the database into CSV files
      const exportFolderSecond = await doExport(secondImportedModel.id);
      // 2.3 Assert that the exported CSV files have the same content as the imported CSV files from 2.1
      await assertCSVFilesHaveTheSameContent(exportFolderFirst, exportFolderSecond, firstImportedModel);
    },
    90000 // Approximate timeout for the one-pass roundtrip full ESCO test is 1.5 minutes
  );
});

async function doImport(dataFolder: string): Promise<IModelInfo> {
  const newModel: IModelInfo = await getRepositoryRegistry().modelInfo.create({
    name: "CSVImport",
    description: "CSVImport",
    license: "CSVImport License",
    UUIDHistory: [randomUUID()],
    locale: {
      name: "en",
      UUID: randomUUID(),
      shortCode: "en",
    },
  });
  const importIdToDBIdMap: Map<string, string> = new Map<string, string>();
  await parseOccupationGroupsFromFile(newModel.id, `${dataFolder}/occupation_groups.csv`, importIdToDBIdMap);
  await parseOccupationsFromFile(newModel.id, `${dataFolder}/occupations.csv`, importIdToDBIdMap);
  await parseSkillGroupsFromFile(newModel.id, `${dataFolder}/skill_groups.csv`, importIdToDBIdMap);
  await parseSkillsFromFile(newModel.id, `${dataFolder}/skills.csv`, importIdToDBIdMap);
  await parseOccupationHierarchyFromFile(newModel.id, `${dataFolder}/occupation_hierarchy.csv`, importIdToDBIdMap);
  await parseSkillHierarchyFromFile(newModel.id, `${dataFolder}/skill_hierarchy.csv`, importIdToDBIdMap);
  await parseSkillToSkillRelationFromFile(newModel.id, `${dataFolder}/skill_to_skill_relations.csv`, importIdToDBIdMap);
  await parseOccupationToSkillRelationFromFile(
    newModel.id,
    `${dataFolder}/occupation_to_skill_relations.csv`,
    importIdToDBIdMap
  );
  expect(errorLogger.errorCount).toEqual(0);
  expect(errorLogger.warningCount).toEqual(0);
  expect(console.error as jest.Mock).not.toHaveBeenCalled();
  expect(console.warn as jest.Mock).not.toHaveBeenCalled();
  return newModel;
}

async function doExport(modelId: string) {
  // clear the error logger
  errorLogger.clear();
  // GIVEN an export process is pending for that model
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

  // AND async event for that model and process
  const givenAsyncExportEvent: AsyncExportEvent = {
    modelId: modelId,
    exportProcessStateId: givenExportProcessState.id,
  };
  // AND a context object
  const  // GIVEN a context object
    givenContext = {
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
          const writeStream = fs.createWriteStream(`./tmp/${fileName}`);
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
  const actualExportProcessState = await getRepositoryRegistry().exportProcessState.findById(
    givenExportProcessState.id
  );
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
  return extractFolder;
}

async function assertCSVFilesHaveTheSameContent(folder1: string, folder2: string, model: IModelInfo) {
  const map1 = new Mapper();
  mapOccupationCSVFile(`${folder1}/occupations.csv`, map1);
  mapEntityCSVFile(`${folder1}/occupation_groups.csv`, CSVObjectTypes.OccupationGroup, map1);
  mapEntityCSVFile(`${folder1}/skill_groups.csv`, CSVObjectTypes.SkillGroup, map1);
  mapEntityCSVFile(`${folder1}/skills.csv`, CSVObjectTypes.Skill, map1);

  const map2 = new Mapper();
  mapOccupationCSVFile(`${folder2}/occupations.csv`, map2);
  mapEntityCSVFile(`${folder2}/occupation_groups.csv`, CSVObjectTypes.OccupationGroup, map2);
  mapEntityCSVFile(`${folder2}/skill_groups.csv`, CSVObjectTypes.SkillGroup, map2);
  mapEntityCSVFile(`${folder2}/skills.csv`, CSVObjectTypes.Skill, map2);

  compareHierarchyCSVContent(`${folder1}/occupation_hierarchy.csv`, map1, `${folder2}/occupation_hierarchy.csv`, map2);
  compareHierarchyCSVContent(`${folder1}/skill_hierarchy.csv`, map1, `${folder2}/skill_hierarchy.csv`, map2);
  compareSkillToSkillCSV(
    `${folder1}/skill_to_skill_relations.csv`,
    map1,
    `${folder2}/skill_to_skill_relations.csv`,
    map2
  );
  compareOccupationToSkillCSVContent(
    `${folder1}/occupation_to_skill_relations.csv`,
    map1,
    `${folder2}/occupation_to_skill_relations.csv`,
    map2
  );

  compareCSVContent(`${folder1}/occupation_groups.csv`, `${folder2}/occupation_groups.csv`);
  compareOccupationsContent(`${folder1}/occupations.csv`, `${folder2}/occupations.csv`);
  compareCSVContent(`${folder1}/skill_groups.csv`, `${folder2}/skill_groups.csv`);
  compareCSVContent(`${folder1}/skills.csv`, `${folder2}/skills.csv`);
  checkFileIncludesContent(model.license, `${folder2}/LICENSE`);
}

function mapOccupationCSVFile(file: string, mapper: Mapper) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse(fs.readFileSync(path.resolve(file)), { columns: true }).forEach((row: any) => {
    const uuidHistory = arrayFromString(row.UUIDHISTORY);
    const uuid = uuidHistory[uuidHistory.length - 1];
    mapper.addIdMapping(row.ID, row.OCCUPATIONTYPE, uuid);
  });
}

function mapEntityCSVFile(file: string, entityType: CSVObjectTypes, mapper: Mapper) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse(fs.readFileSync(path.resolve(file)), { columns: true }).forEach((row: any) => {
    const uuidHistory = arrayFromString(row.UUIDHISTORY);
    const uuid = uuidHistory[uuidHistory.length - 1];
    mapper.addIdMapping(row.ID, entityType, uuid);
  });
}

function compareCSVContent(file1: string, file2: string) {
  const map1 = new Map<string, unknown>();
  const entitiesMissingUUID1 = []; // entities that have no UUIDHistory from file 1
  const entitiesMissingUUID2 = []; // entities that have no UUIDHistory from file 2

  // Read CSV files and parse their content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData1 = parse(fs.readFileSync(path.resolve(file1)), { columns: true }).map((row: any) => {
    // if there is a file with no UUIDHistory, add it to the entitiesMissingUUID1
    // for later comparison, because we can't compare it with the other file
    // since there is no UUID.
    if(!row.UUIDHISTORY){
      entitiesMissingUUID1.push(row);
      return;
    }

    // Delete the ID field from the parsed CSV data
    delete row.ID;
    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Remove the metrics fields from the parsed CSV data
    delete row.DEGREECENTRALITY;
    delete row.INTEROCCUPATIONTRANSFERABILITY;
    delete row.UNSEENTOSEENTRANSFERABILITY;
    // Keep only the original UUID field from the parsed CSV data
    const uuidHistory = arrayFromString(row.UUIDHISTORY);
    row.UUIDHISTORY = uuidHistory[uuidHistory.length - 1];
    map1.set(row.UUIDHISTORY, row);
    return row;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData2 = parse(fs.readFileSync(path.resolve(file2)), { columns: true }).map((row: any) => {
    // Remove the ID field from the parsed CSV data
    delete row.ID;
    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Remove the metrics fields from the parsed CSV data
    delete row.DEGREECENTRALITY;
    delete row.INTEROCCUPATIONTRANSFERABILITY;
    delete row.UNSEENTOSEENTRANSFERABILITY;
    // Keep only the original UUID field from the parsed CSV data
    const uuidHistory = arrayFromString(row.UUIDHISTORY);
    row.UUIDHISTORY = uuidHistory[uuidHistory.length - 1];

    // if there is a row with no reference from first file, add it to the entitiesMissingUUID2
    // because the current UUID is not in the first file.
    // we will have to compare the size of entitiesMissingUUID1 and entitiesMissingUUID2
    // to assert that the two files have the same entities with no UUID.
    if (!map1.get(row.UUIDHISTORY)){
      entitiesMissingUUID2.push(row);
      return;
    }

    expect(map1.get(row.UUIDHISTORY)).toEqual(row); // assert that all object in file2 are in file1
    return row;
  });
  expect(csvData1.length).toBeGreaterThan(0);
  expect(csvData2.length).toBeGreaterThan(0);
  // By asserting that the two lists have equal length,
  // we are also "almost" asserting that there are "identical".
  // This is because we have asserted that all objects in file2 are in file1
  // and that the two list have the same length.
  // Assuming that file 1 does not have any duplicates, then the two lists are identical.
  expect(csvData1.length).toEqual(csvData2.length);
  // Using toIncludeSameMembers would be more accurate:
  // expect(csvData1).toIncludeSameMembers(csvData2);
  // However it is very slow as it compares each object in the list.
  // We are using the UUID instead speed up the comparison .

  // also expect that the size of entities with no UUID from file 1 are the same as
  // the size of entities with no UUID from file 2
  expect(entitiesMissingUUID1.length).toEqual(entitiesMissingUUID2.length);
}

function compareOccupationsContent(file1: string, file2: string) {
  const map1 = new Map<string, unknown>();

  // Read CSV files and parse their content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData1 = parse(fs.readFileSync(path.resolve(file1)), { columns: true }).map((row: any) => {
    // Delete the ID field from the parsed CSV data
    delete row.ID;
    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Keep only the original UUID field from the parsed CSV data
    map1.set(row.CODE, row);
    return row;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData2 = parse(fs.readFileSync(path.resolve(file2)), { columns: true }).map((row: any) => {
    // Remove the ID field from the parsed CSV data
    delete row.ID;
    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Because UUID can change in cases like.
    // 1. No UUID that was uploaded and the server generated a new one.
    //    In this case, the UUIDHistory will have the generated UUID.
    //    We can't compare because on the second phase the server will generate a new UUID. which is not present on the first phase.
    row.UUIDHISTORY = expect.any(String);
    expect(map1.get(row.CODE)).toEqual(row); // assert that all object in file2 are in file1
    return row;
  });

  expect(csvData1.length).toBeGreaterThan(0);
  expect(csvData2.length).toBeGreaterThan(0);
  // By asserting that the two lists have equal length,
  // we are also "almost" asserting that there are "identical".
  // This is because we have asserted that all objects in file2 are in file1
  // and that the two list have the same length.
  // Assuming that file 1 does not have any duplicates, then the two lists are identical.
  expect(csvData1.length).toEqual(csvData2.length);
  // Using toIncludeSameMembers would be more accurate:
  // expect(csvData1).toIncludeSameMembers(csvData2);
  // However it is very slow as it compares each object in the list.
  // We are using the UUID instead speed up the comparison .
}


function compareHierarchyCSVContent(file1: string, mapper1: Mapper, file2: string, mapper2: Mapper) {
  // Read CSV files and parse their content
  const map1 = new Map<string, unknown>();
  const entitiesMissingUUID1 = []; // entities that have no UUIDHistory from file 1
  const entitiesMissingUUID2 = []; // entities that have no UUIDHistory from file 2

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData1 = parse(fs.readFileSync(path.resolve(file1)), { columns: true }).map((row: any) => {
    // Map the parent and child IDs to their UUIDs
    row.PARENTID = mapper1.getUUID(row.PARENTID, row.PARENTOBJECTTYPE);
    row.CHILDID = mapper1.getUUID(row.CHILDID, row.CHILDOBJECTTYPE);

    if(!row.PARENTID || !row.CHILDID){
      entitiesMissingUUID1.push(row);
      return;
    }

    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Remove the metrics fields from the parsed CSV data
    delete row.DEGREECENTRALITY;
    delete row.INTEROCCUPATIONTRANSFERABILITY;
    delete row.UNSEENTOSEENTRANSFERABILITY;
    map1.set(row.PARENTID + row.CHILDID, row);
    return row;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData2 = parse(fs.readFileSync(path.resolve(file2)), { columns: true }).map((row: any) => {
    // Map the parent and child IDs to their UUIDs
    row.PARENTID = mapper2.getUUID(row.PARENTID, row.PARENTOBJECTTYPE);
    row.CHILDID = mapper2.getUUID(row.CHILDID, row.CHILDOBJECTTYPE);
    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Remove the metrics fields from the parsed CSV data
    delete row.DEGREECENTRALITY;
    delete row.INTEROCCUPATIONTRANSFERABILITY;
    delete row.UNSEENTOSEENTRANSFERABILITY;

    if(!map1.get(row.PARENTID + row.CHILDID)){
      entitiesMissingUUID2.push(row);
      return;
    }

    expect(map1.get(row.PARENTID + row.CHILDID)).toEqual(row); // assert that all object in file2 are in file1
    return row;
  });

  expect(csvData1.length).toBeGreaterThan(0);
  expect(csvData2.length).toBeGreaterThan(0);
  // By asserting that the two lists have equal length,
  // we are also "almost" asserting that there are "identical".
  // This is because we have asserted that all tuples (parent-child) in file2 are in file1
  // and that the two list have the same length.
  // Assuming that file 1 does not have any duplicates, then the two lists are identical.
  expect(csvData1.length).toEqual(csvData2.length);
  // Using toIncludeSameMembers would be more accurate:
  // expect(csvData1).toIncludeSameMembers(csvData2);
  // However it is very slow as it compares each object in the list.
  // We are using the UUID instead speed up the comparison .

  // also expect that the size of entities with no UUID from file 1 are the same as
  // the size of entities with no UUID from file 2
  expect(entitiesMissingUUID1.length).toEqual(entitiesMissingUUID2.length);
}

function compareSkillToSkillCSV(file1: string, mapper1: Mapper, file2: string, mapper2: Mapper) {
  // Read CSV files and parse their content
  const map1 = new Map<string, unknown>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData1 = parse(fs.readFileSync(path.resolve(file1)), { columns: true }).map((row: any) => {
    // Map the requiring and required IDs to their UUIDs
    row.REQUIRINGID = mapper1.getUUID(row.REQUIRINGID, CSVObjectTypes.Skill);
    row.REQUIREDID = mapper1.getUUID(row.REQUIREDID, CSVObjectTypes.Skill);
    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Remove the metrics fields from the parsed CSV data
    delete row.DEGREECENTRALITY;
    delete row.INTEROCCUPATIONTRANSFERABILITY;
    delete row.UNSEENTOSEENTRANSFERABILITY;
    map1.set(row.REQUIRINGID + row.REQUIREDID, row);
    return row;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData2 = parse(fs.readFileSync(path.resolve(file2)), { columns: true }).map((row: any) => {
    // Map the requiring and required IDs to their UUIDs
    row.REQUIRINGID = mapper2.getUUID(row.REQUIRINGID, CSVObjectTypes.Skill);
    row.REQUIREDID = mapper2.getUUID(row.REQUIREDID, CSVObjectTypes.Skill);
    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Remove the metrics fields from the parsed CSV data
    delete row.DEGREECENTRALITY;
    delete row.INTEROCCUPATIONTRANSFERABILITY;
    delete row.UNSEENTOSEENTRANSFERABILITY;
    expect(map1.get(row.REQUIRINGID + row.REQUIREDID)).toEqual(row); // assert that all object in file2 are in file1
    return row;
  });
  expect(csvData1.length).toBeGreaterThan(0);
  expect(csvData2.length).toBeGreaterThan(0);
  // By asserting that the two lists have equal length,
  // we are also "almost" asserting that there are "identical".
  // This is because we have asserted that all tuples (requiring-required) in file2 are in file1
  // and that the two list have the same length.
  // Assuming that file 1 does not have any duplicates, then the two lists are identical.
  expect(csvData1.length).toEqual(csvData2.length);
  // Using toIncludeSameMembers would be more accurate:
  // expect(csvData1).toIncludeSameMembers(csvData2);
  // However it is very slow as it compares each object in the list.
  // We are using the UUID instead speed up the comparison .
}

function compareOccupationToSkillCSVContent(file1: string, mapper1: Mapper, file2: string, mapper2: Mapper) {
  const map1 = new Map<string, unknown>();
  const entitiesMissingUUID1 = []; // entities that have no UUIDHistory from file 1
  const entitiesMissingUUID2 = []; // entities that have no UUIDHistory from file 2

  // Read CSV files and parse their content
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData1 = parse(fs.readFileSync(path.resolve(file1)), { columns: true }).map((row: any) => {
    // Map the occupation and skill IDs to their UUIDs
    row.OCCUPATIONID = mapper1.getUUID(row.OCCUPATIONID, row.OCCUPATIONTYPE);
    row.SKILLID = mapper1.getUUID(row.SKILLID, CSVObjectTypes.Skill);
    // if there is a file with no UUIDHistory, add it to the entitiesMissingUUID1
    // for later comparison, because we can't compare it with the other file
    // since there is no UUID.
    if(!row.OCCUPATIONID || !row.SKILLID){
      entitiesMissingUUID1.push(row);
      return;
    }

    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Remove the metrics fields from the parsed CSV data
    delete row.DEGREECENTRALITY;
    delete row.INTEROCCUPATIONTRANSFERABILITY;
    delete row.UNSEENTOSEENTRANSFERABILITY;
    map1.set(row.OCCUPATIONID + row.SKILLID, row);
    return row;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const csvData2 = parse(fs.readFileSync(path.resolve(file2)), { columns: true }).map((row: any) => {
    // Map the occupation and skill IDs to their UUIDs
    row.OCCUPATIONID = mapper2.getUUID(row.OCCUPATIONID, row.OCCUPATIONTYPE);
    row.SKILLID = mapper2.getUUID(row.SKILLID, CSVObjectTypes.Skill);
    // Remove the created and updated fields from the parsed CSV data
    delete row.CREATEDAT;
    delete row.UPDATEDAT;
    // Remove the metrics fields from the parsed CSV data
    delete row.DEGREECENTRALITY;
    delete row.INTEROCCUPATIONTRANSFERABILITY;
    delete row.UNSEENTOSEENTRANSFERABILITY;
    // if there is a row with no reference from first file, add it to the entitiesMissingUUID2
    // because the current UUID is not in the first file.
    // we will have to compare the size of entitiesMissingUUID1 and entitiesMissingUUID2
    // to assert that the two files have the same entities with no UUID.
    if (!map1.get(row.OCCUPATIONID + row.SKILLID)){
      entitiesMissingUUID2.push(row);
      return;
    }
    expect(map1.get(row.OCCUPATIONID + row.SKILLID)).toEqual(row); // assert that all object in file2 are in file1
    return row;
  });
  expect(csvData2.length).toBeGreaterThan(0);
  // By asserting that the two lists have equal length,
  // we are also "almost" asserting that there are "identical".
  // This is because we have asserted that all tuples (occupation-skill) in file2 are in file1
  // and that the two list have the same length.
  // Assuming that file 1 does not have any duplicates, then the two lists are identical.
  expect(csvData1.length).toEqual(csvData2.length);
  // Using toIncludeSameMembers would be more accurate:
  // expect(csvData1).toIncludeSameMembers(csvData2);
  // However it is very slow as it compares each object in the list.
  // We are using the UUID instead speed up the comparison.

  // also expect that the size of entities with no UUID from file 1 are the same as
  // the size of entities with no UUID from file 2
  expect(entitiesMissingUUID1.length).toEqual(entitiesMissingUUID2.length);
}

function checkFileIncludesContent(content: string, file: string) {
  // read from file.
  const fileContent = fs.readFileSync(file, {
    encoding: "utf8",
  });
  // check content matches the file content.
  expect(fileContent).toEqual(content);
}

class Mapper {
  mapIDToUUID = new Map<string, string>();

  constructor() {}

  addIdMapping(id: string, objectType: CSVObjectTypes, uuid: string) {
    this.mapIDToUUID.set(objectType + ":" + id, uuid);
  }

  getUUID(id: string, objectType: CSVObjectTypes) {
    return this.mapIDToUUID.get(objectType + ":" + id);
  }
}
