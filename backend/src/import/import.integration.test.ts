//mute console.log
import "_test_utilities/consoleMock";

import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import * as process from "process";
import {ENV_VAR_NAMES} from "server/config/config";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {IModelInfo, INewModelInfoSpec} from "modelInfo/modelInfoModel";
import {randomUUID} from "crypto";
import {parseISCOGroupsFromFile} from "./esco/ISCOGroups/ISCOGroupsParser";
import {parseSkillGroupsFromFile} from "./esco/skillGroups/skillGroupsParser";
import {parseSkillsFromFile} from "./esco/skills/skillsParser";
import {parseOccupationsFromFile} from "./esco/occupations/occupationsParser";
import {parseOccupationHierarchyFromFile} from "./esco/occupationHierarchy/occupationHierarchyParser";

describe("Test Import sample CSV files with an in-memory mongodb", () => {
  const originalEnv: { [key: string]: string } = {};
  // Backup and restore the original env variables
  beforeAll(() => {
    Object.keys(process.env).forEach((key) => {
      originalEnv[key] = process.env[key] as string;
    });
  });

  afterAll(() => {
    // restore original env variables
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
    const numberOfParsedISCOGroups = await parseISCOGroupsFromFile(modelInfo.id, dataFolder + "ISCOGroups.csv", importIdToDBIdMap);
    expect(numberOfParsedISCOGroups).toBeGreaterThan(0);
    expect(importIdToDBIdMap.size).toEqual(numberOfParsedISCOGroups);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    // 03. Import the ESCO Skill Groups CSV files
    const numberOfParsedSkillGroups = await parseSkillGroupsFromFile(modelInfo.id, dataFolder + "skillGroups.csv", importIdToDBIdMap);
    expect(numberOfParsedSkillGroups).toBeGreaterThan(0);
    expect(importIdToDBIdMap.size).toEqual(numberOfParsedISCOGroups + numberOfParsedSkillGroups);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    // 04. Import the ESCO Skills CSV files
    const numberOfParsedSkills = await parseSkillsFromFile(modelInfo.id, dataFolder + "skills.csv", importIdToDBIdMap);
    expect(numberOfParsedSkills).toBeGreaterThan(0);
    expect(importIdToDBIdMap.size).toEqual(numberOfParsedISCOGroups + numberOfParsedSkillGroups + numberOfParsedSkills);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    // 05. Import the Occupations CSV files
    const numberOfParsedOccupations = await parseOccupationsFromFile(modelInfo.id, dataFolder + "occupations.csv", importIdToDBIdMap);
    expect(numberOfParsedOccupations).toBeGreaterThan(0);
    expect(importIdToDBIdMap.size).toEqual(numberOfParsedISCOGroups + numberOfParsedSkillGroups + numberOfParsedSkills + numberOfParsedOccupations);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    // 06. Import occupation hierarchy
    const numberOfParsedOccHierarchy = await parseOccupationHierarchyFromFile(modelInfo.id, dataFolder + "occupations_hierarchy.csv", importIdToDBIdMap);
    expect(numberOfParsedOccHierarchy).toBeGreaterThan(0);
    // every occupation should have one parent occupation, except for the 10 top level occupations (the 10 top level ISCO groups)
    expect(numberOfParsedOccHierarchy).toEqual(numberOfParsedISCOGroups + numberOfParsedOccupations - 10);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();


  }, 30000); // 30 seconds timeout to allow for the import to complete
});