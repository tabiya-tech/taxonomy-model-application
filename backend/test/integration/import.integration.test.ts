//mute console.log
import "_test_utilities/consoleMock";

import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import * as process from "process";
import { ENV_VAR_NAMES } from "server/config/config";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { randomUUID } from "crypto";
import { parseISCOGroupsFromFile } from "import/esco/ISCOGroups/ISCOGroupsParser";
import { parseSkillGroupsFromFile } from "import/esco/skillGroups/skillGroupsParser";
import { parseSkillsFromFile } from "import/esco/skills/skillsParser";
import { parseOccupationsFromFile } from "import/esco/occupations/occupationsParser";
import { parseOccupationHierarchyFromFile } from "import/esco/occupationHierarchy/occupationHierarchyParser";
import { RowsProcessedStats } from "import/rowsProcessedStats.types";
import { IModelInfo } from "modelInfo/modelInfo.types";
import errorLogger from "common/errorLogger/errorLogger";
import { parseSkillHierarchyFromFile } from "import/esco/skillHierarchy/skillHierarchyParser";
import { parseSkillToSkillRelationFromFile } from "import/esco/skillToSkillRelation/skillToSkillRelationParser";
import { parseOccupationToSkillRelationFromFile } from "import/esco/occupationToSkillRelation/occupationToSkillRelationParser";
import mongoose from "mongoose";
import { countCSVRecords } from "import/esco/_test_utilities/countCSVRecords";

enum DataTestType {
  SAMPLE = "SAMPLE",
  ESCO = "ESCO",
}

describe("Test Import CSV files with an in-memory mongodb", () => {
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
  // Uncomment the first DataTestType.ESCO line in order to run the ESCO import test
  // This skip is here because the ESCO import takes a long time to run,
  // and it should not be run as part of the pipeline on GitHub
  test.each([
    [DataTestType.ESCO, "../data-sets/csv/tabiya-esco-v1.1.1/"],
    [DataTestType.SAMPLE, "../data-sets/csv/tabiya-sample/"],
  ])(
    "should import the %s CSV files",
    async (dataTestType, dataFolder) => {
      // GIVEN some csv files
      // AND a model to import into
      const modelInfo: IModelInfo = await getRepositoryRegistry().modelInfo.create({
        name: "CSVImport",
        description: "CSVImport",
        UUIDHistory: [randomUUID()],
        locale: {
          name: "en",
          UUID: randomUUID(),
          shortCode: "en",
        },
      });

      const importIdToDBIdMap: Map<string, string> = new Map<string, string>();

      // WHEN the CSV files are parsed and data is imported

      // parse the entities first

      // parse the ISCOGroups.csv file and assert that all rows were imported successfully
      await assertEntityImportedSuccessfully(
        () => parseISCOGroupsFromFile(modelInfo.id, dataFolder + "ISCOGroups.csv", importIdToDBIdMap),
        getRepositoryRegistry().ISCOGroup.Model,
        dataFolder + "ISCOGroups.csv"
      );
      // parse the skillGroups.csv file and assert that all rows were imported successfully
      await assertEntityImportedSuccessfully(
        () => parseSkillGroupsFromFile(modelInfo.id, dataFolder + "skillGroups.csv", importIdToDBIdMap),
        getRepositoryRegistry().skillGroup.Model,
        dataFolder + "skillGroups.csv"
      );
      // parse the skills.csv file and assert that all rows were imported successfully
      await assertEntityImportedSuccessfully(
        () => parseSkillsFromFile(modelInfo.id, dataFolder + "skills.csv", importIdToDBIdMap),
        getRepositoryRegistry().skill.Model,
        dataFolder + "skills.csv"
      );
      // TODO: ADD the ESCO_ORIGINAL_OCCUPATIONS.csv here

      // parse the occupations.csv file and assert that all rows were imported successfully
      await assertEntityImportedSuccessfully(
        () => parseOccupationsFromFile(modelInfo.id, dataFolder + "occupations.csv", importIdToDBIdMap),
        getRepositoryRegistry().occupation.Model,
        dataFolder + "occupations.csv"
      );

      // finally parse the relations between the entities and assert that all rows were imported successfully,
      // since they depend on the entities being imported first

      // parse the occupations_hierarchy.csv file and assert that all rows were imported successfully
      await assertEntityImportedSuccessfully(
        () =>
          parseOccupationHierarchyFromFile(modelInfo.id, dataFolder + "occupations_hierarchy.csv", importIdToDBIdMap),
        getRepositoryRegistry().occupationHierarchy.hierarchyModel,
        dataFolder + "occupations_hierarchy.csv"
      );
      // parse the skills_hierarchy.csv file and assert that all rows were imported successfully
      await assertEntityImportedSuccessfully(
        () => parseSkillHierarchyFromFile(modelInfo.id, dataFolder + "skills_hierarchy.csv", importIdToDBIdMap),
        getRepositoryRegistry().skillHierarchy.hierarchyModel,
        dataFolder + "skills_hierarchy.csv"
      );
      // parse the skill_skill_relations.csv file and assert that all rows were imported successfully
      await assertEntityImportedSuccessfully(
        () =>
          parseSkillToSkillRelationFromFile(modelInfo.id, dataFolder + "skill_skill_relations.csv", importIdToDBIdMap),
        getRepositoryRegistry().skillToSkillRelation.relationModel,
        dataFolder + "skill_skill_relations.csv"
      );
      // parse the occupation_skill_relations.csv file and assert that all rows were imported successfully
      await assertEntityImportedSuccessfully(
        () =>
          parseOccupationToSkillRelationFromFile(
            modelInfo.id,
            dataFolder + "occupation_skill_relations.csv",
            importIdToDBIdMap
          ),
        getRepositoryRegistry().occupationToSkillRelation.relationModel,
        dataFolder + "occupation_skill_relations.csv"
      );
    },
    60000 // Should remain at 1 min for the Sample files, but can be increased to 3 min in case of testing both Sample and full ESCO files
  );
});

const assertEntityImportedSuccessfully = async (
  parserCallback: () => Promise<RowsProcessedStats>,
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: mongoose.Model<any>,
  fileName: string
) => {
  const parsedStats = await parserCallback();
  const csvRowCount = countCSVRecords(fileName);
  const dbRowCount = await model.countDocuments({});
  console.log(fileName, "csvRowCount", csvRowCount, "dbRowCount", dbRowCount);
  assertSuccessfullyImported(
    parsedStats,
    csvRowCount,
    dbRowCount,
    jest.spyOn(console, "error"),
    jest.spyOn(console, "warn")
  );
};

function assertSuccessfullyImported(
  stats: RowsProcessedStats,
  csvRowCount: number,
  dbRowCount: number,
  consoleErrorSpy: jest.SpyInstance,
  consoleWarnSpy: jest.SpyInstance
) {
  // expect all the rows to have been processed
  expect(stats.rowsProcessed).toBeGreaterThan(0);
  expect(stats.rowsProcessed).toEqual(csvRowCount);
  // expect all the rows to have been successfully parsed into the database
  expect(stats.rowsSuccess).toEqual(csvRowCount);
  expect(stats.rowsSuccess).toEqual(dbRowCount);
  // expect no errors or warnings to have been logged
  expect(stats.rowsSuccess).toEqual(stats.rowsProcessed);
  expect(stats.rowsFailed).toEqual(0);
  expect(errorLogger.errorCount).toEqual(0);
  expect(errorLogger.warningCount).toEqual(0);
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  expect(consoleWarnSpy).not.toHaveBeenCalled();
}
