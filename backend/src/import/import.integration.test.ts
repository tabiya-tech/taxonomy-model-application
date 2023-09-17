//mute console.log
import "_test_utilities/consoleMock";

import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import * as process from "process";
import {ENV_VAR_NAMES} from "server/config/config";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegistry";
import {randomUUID} from "crypto";
import {parseISCOGroupsFromFile} from "./esco/ISCOGroups/ISCOGroupsParser";
import {parseSkillGroupsFromFile} from "./esco/skillGroups/skillGroupsParser";
import {parseSkillsFromFile} from "./esco/skills/skillsParser";
import {parseOccupationsFromFile} from "./esco/occupations/occupationsParser";
import {parseOccupationHierarchyFromFile} from "./esco/occupationHierarchy/occupationHierarchyParser";
import {RowsProcessedStats} from "./rowsProcessedStats.types";
import {IModelInfo, INewModelInfoSpec} from "../modelInfo/modelInfo.types";
import importLogger from "./importLogger/importLogger";

describe("Test Import sample CSV files with an in-memory mongodb", () => {
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
    process.env[ENV_VAR_NAMES.MONGODB_URI] = process.env[ENV_VAR_NAMES.MONGODB_URI] + "CSVImportIntegrationTestDB";
    process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_NAME] = "not-used";
    process.env[ENV_VAR_NAMES.UPLOAD_BUCKET_REGION] = "not-used";
    process.env[ENV_VAR_NAMES.ASYNC_LAMBDA_FUNCTION_ARN] = "not-used";
    process.env[ENV_VAR_NAMES.ASYNC_LAMBDA_FUNCTION_REGION] = "not-used";
    await initOnce()
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

  // The actual tests
  test("should import the sample CSV files", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

    // 01. Create a new ModelInfo
    const modelInfo: IModelInfo = await getRepositoryRegistry().modelInfo.create({
      name: "CSVImport",
      description: "CSVImport",
      locale: {
        name: "en",
        UUID: randomUUID(),
        shortCode: "en"
      }
    } as INewModelInfoSpec);

    const importIdToDBIdMap: Map<string, string> = new Map<string, string>();
    const dataFolder = "../data-sets/csv/tabiya-sample/";

    // 02. Import the ISCOGroup CSV files
    const statsISCOGroups = await parseISCOGroupsFromFile(modelInfo.id, dataFolder + "ISCOGroups.csv", importIdToDBIdMap);
    asserSuccessfullyImported(statsISCOGroups, consoleErrorSpy, consoleWarnSpy);
    expect(importIdToDBIdMap.size).toEqual(statsISCOGroups.rowsProcessed);

    // 03. Import the ESCO Skill Groups CSV files
    const statsSkillGroups = await parseSkillGroupsFromFile(modelInfo.id, dataFolder + "skillGroups.csv", importIdToDBIdMap);
    asserSuccessfullyImported(statsSkillGroups, consoleErrorSpy, consoleWarnSpy);
    expect(importIdToDBIdMap.size).toEqual(statsISCOGroups.rowsProcessed + statsSkillGroups.rowsProcessed);

    // 04. Import the ESCO Skills CSV files
    const statsSkills = await parseSkillsFromFile(modelInfo.id, dataFolder + "skills.csv", importIdToDBIdMap);
    asserSuccessfullyImported(statsSkills, consoleErrorSpy, consoleWarnSpy);
    expect(importIdToDBIdMap.size).toEqual(statsISCOGroups.rowsProcessed + statsSkillGroups.rowsProcessed + statsSkills.rowsProcessed);

    // 05. Import the Occupations CSV files
    const statsOccupations = await parseOccupationsFromFile(modelInfo.id, dataFolder + "occupations.csv", importIdToDBIdMap);
    asserSuccessfullyImported(statsOccupations, consoleErrorSpy, consoleWarnSpy);
    expect(importIdToDBIdMap.size).toEqual(statsISCOGroups.rowsProcessed + statsSkillGroups.rowsProcessed + statsSkills.rowsProcessed + statsOccupations.rowsProcessed);

    // 06. Import occupation hierarchy
    const statsOccHierarchy = await parseOccupationHierarchyFromFile(modelInfo.id, dataFolder + "occupations_hierarchy.csv", importIdToDBIdMap);
    asserSuccessfullyImported(statsOccHierarchy, consoleErrorSpy, consoleWarnSpy);
    // every occupation should have one parent occupation, except for the 10 top level occupations (the 10 top level ISCO groups)
    expect(statsOccHierarchy.rowsSuccess).toEqual(statsISCOGroups.rowsSuccess + statsOccupations.rowsSuccess - 10);

  }, 30000); // 30 seconds timeout to allow for the import to complete
});

function asserSuccessfullyImported(stats: RowsProcessedStats, consoleErrorSpy: jest.SpyInstance, consoleWarnSpy: jest.SpyInstance) {
  expect(stats.rowsProcessed).toBeGreaterThan(0);
  expect(stats.rowsSuccess).toEqual(stats.rowsProcessed);
  expect(stats.rowsFailed).toEqual(0);
  expect(importLogger.errorCount).toEqual(0);
  expect(importLogger.warningCount).toEqual(0);
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  expect(consoleWarnSpy).not.toHaveBeenCalled();
}