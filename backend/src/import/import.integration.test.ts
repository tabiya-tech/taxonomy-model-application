//mute console.log
import "_test_utilities/consoleMock";

import {initOnce} from "server/init";
import {getConnectionManager} from "server/connection/connectionManager";
import * as process from "process";
import {ENV_VAR_NAMES} from "server/config/config";

import {getRepositoryRegistry} from "server/repositoryRegistry/repositoryRegisrty";
import {IModelInfo, INewModelInfoSpec} from "modelInfo/modelInfoModel";
import {randomUUID} from "crypto";
import {parseISCOGroupsFromFile} from "./ISCOGroups/ISCOGroupsParser";
import {parseSkillGroupsFromFile} from "./skillGroups/skillGroupsParser";
import {parseSkillsFromFile} from "./skills/skillsParser";


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

    // 02. Import the ISCOGroup CSV files
    await parseISCOGroupsFromFile(modelInfo.id, "../data-sets/csv/tabiya-sample/ISCOGroups.csv");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    // 03. Import the ESCO Skill Groups CSV files
    await parseSkillGroupsFromFile(modelInfo.id, "../data-sets/csv/tabiya-sample/skillGroups.csv");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    // 04. Import the ESCO Skills CSV files
    await parseSkillsFromFile(modelInfo.id, "../data-sets/csv/tabiya-sample/skills.csv");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  }, 30000); // 30 seconds timeout to allow for the import to complete
});