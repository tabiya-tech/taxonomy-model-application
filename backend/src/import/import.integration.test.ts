//mute console.log
import "_test_utilities/consoleMock";

import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import * as process from "process";
import { ENV_VAR_NAMES } from "server/config/config";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { randomUUID } from "crypto";
import { parseISCOGroupsFromFile } from "./esco/ISCOGroups/ISCOGroupsParser";
import { parseSkillGroupsFromFile } from "./esco/skillGroups/skillGroupsParser";
import { parseSkillsFromFile } from "./esco/skills/skillsParser";
import { parseOccupationsFromFile } from "./esco/occupations/occupationsParser";
import { parseOccupationHierarchyFromFile } from "./esco/occupationHierarchy/occupationHierarchyParser";
import { RowsProcessedStats } from "./rowsProcessedStats.types";
import { IModelInfo, INewModelInfoSpec } from "modelInfo/modelInfo.types";
import importLogger from "./importLogger/importLogger";
import { parseSkillHierarchyFromFile } from "./esco/skillHierarchy/skillHierarchyParser";
import fs from "fs";
import { parse } from "csv-parse";
import { parseSkillToSkillRelationFromFile } from "./esco/skillToSkillRelation/skillToSkillRelationParser";
import { parseOccupationToSkillRelationFromFile } from "./esco/occupationToSkillRelation/occupationToSkillRelationParser";

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

  // The actual tests
  test("should import the sample CSV files", async () => {
    // GIVEN some sample csv files
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    // AND a model to import into
    const modelInfo: IModelInfo = await getRepositoryRegistry().modelInfo.create({
      name: "CSVImport",
      description: "CSVImport",
      locale: {
        name: "en",
        UUID: randomUUID(),
        shortCode: "en",
      },
    } as INewModelInfoSpec);

    const importIdToDBIdMap: Map<string, string> = new Map<string, string>();

    const dataFolder = "../data-sets/csv/tabiya-sample/";

    // WHEN the CSV files are parsed and data is imported
    const statsISCOGroups = await parseISCOGroupsFromFile(
      modelInfo.id,
      dataFolder + "ISCOGroups.csv",
      importIdToDBIdMap
    );
    const statsSkillGroups = await parseSkillGroupsFromFile(
      modelInfo.id,
      dataFolder + "skillGroups.csv",
      importIdToDBIdMap
    );
    const statsSkills = await parseSkillsFromFile(modelInfo.id, dataFolder + "skills.csv", importIdToDBIdMap);
    const statsOccupations = await parseOccupationsFromFile(
      modelInfo.id,
      dataFolder + "occupations.csv",
      importIdToDBIdMap
    );
    const statsOccHierarchy = await parseOccupationHierarchyFromFile(
      modelInfo.id,
      dataFolder + "occupations_hierarchy.csv",
      importIdToDBIdMap
    );
    const statsSkillHierarchy = await parseSkillHierarchyFromFile(
      modelInfo.id,
      dataFolder + "skills_hierarchy.csv",
      importIdToDBIdMap
    );
    const statsSkillToSkillRelation = await parseSkillToSkillRelationFromFile(
      modelInfo.id,
      dataFolder + "skill_skill_relations.csv",
      importIdToDBIdMap
    );
    const statsOccupationToSkillRelation = await parseOccupationToSkillRelationFromFile(
      modelInfo.id,
      dataFolder + "occupation_skill_relations.csv",
      importIdToDBIdMap
    );

    const [
      ISCOGroupsCSVRowCount,
      SkillGroupsCSVRowCount,
      SkillsCSVRowCount,
      OccupationsCSVRowCount,
      OccupationHierarchyCSVRowCount,
      SkillHierarchyCSVRowCount,
      SkillToSkillRelationCSVRowCount,
      OccupationToSkillRelationCSVRowCount,
    ] = await Promise.all([
      countRowsInCSV(dataFolder + "ISCOGroups.csv"),
      countRowsInCSV(dataFolder + "skillGroups.csv"),
      countRowsInCSV(dataFolder + "skills.csv"),
      countRowsInCSV(dataFolder + "occupations.csv"),
      countRowsInCSV(dataFolder + "occupations_hierarchy.csv"),
      countRowsInCSV(dataFolder + "skills_hierarchy.csv"),
      countRowsInCSV(dataFolder + "skill_skill_relations.csv"),
      countRowsInCSV(dataFolder + "occupation_skill_relations.csv"),
    ]);

    const [
      ISCOGroupsDBRowCount,
      SkillGroupsDBRowCount,
      SkillsDBRowCount,
      OccupationsDBRowCount,
      OccupationHierarchyDBRowCount,
      SkillHierarchyDBRowCount,
      SkillToSkillRelationDBRowCount,
      OccupationToSkillRelationDBRowCount,
    ] = await Promise.all([
      getRepositoryRegistry().ISCOGroup.Model.countDocuments({}),
      getRepositoryRegistry().skillGroup.Model.countDocuments({}),
      getRepositoryRegistry().skill.Model.countDocuments({}),
      getRepositoryRegistry().occupation.Model.countDocuments({}),
      getRepositoryRegistry().occupationHierarchy.hierarchyModel.countDocuments({}),
      getRepositoryRegistry().skillHierarchy.hierarchyModel.countDocuments({}),
      getRepositoryRegistry().skillToSkillRelation.relationModel.countDocuments({}),
      getRepositoryRegistry().occupationToSkillRelation.relationModel.countDocuments({}),
    ]);

    // THEN expect all the files to have been imported successfully
    assertSuccessfullyImported(
      statsISCOGroups,
      ISCOGroupsCSVRowCount,
      ISCOGroupsDBRowCount,
      consoleErrorSpy,
      consoleWarnSpy
    );
    assertSuccessfullyImported(
      statsSkillGroups,
      SkillGroupsCSVRowCount,
      SkillGroupsDBRowCount,
      consoleErrorSpy,
      consoleWarnSpy
    );
    assertSuccessfullyImported(statsSkills, SkillsCSVRowCount, SkillsDBRowCount, consoleErrorSpy, consoleWarnSpy);
    assertSuccessfullyImported(
      statsOccupations,
      OccupationsCSVRowCount,
      OccupationsDBRowCount,
      consoleErrorSpy,
      consoleWarnSpy
    );
    assertSuccessfullyImported(
      statsOccHierarchy,
      OccupationHierarchyCSVRowCount,
      OccupationHierarchyDBRowCount,
      consoleErrorSpy,
      consoleWarnSpy
    );
    assertSuccessfullyImported(
      statsSkillHierarchy,
      SkillHierarchyCSVRowCount,
      SkillHierarchyDBRowCount,
      consoleErrorSpy,
      consoleWarnSpy
    );
    assertSuccessfullyImported(
      statsSkillToSkillRelation,
      SkillToSkillRelationCSVRowCount,
      SkillToSkillRelationDBRowCount,
      consoleErrorSpy,
      consoleWarnSpy
    );
    assertSuccessfullyImported(
      statsOccupationToSkillRelation,
      OccupationToSkillRelationCSVRowCount,
      OccupationToSkillRelationDBRowCount,
      consoleErrorSpy,
      consoleWarnSpy
    );
  }, 90000);
});

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
  expect(importLogger.errorCount).toEqual(0);
  expect(importLogger.warningCount).toEqual(0);
  expect(consoleErrorSpy).not.toHaveBeenCalled();
  expect(consoleWarnSpy).not.toHaveBeenCalled();
}

// utility function to count the number of rows in a CSV file
async function countRowsInCSV(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let rowCount = -1; // start from -1 to compensate for the header row
    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: "," }))
      .on("data", () => rowCount++)
      .on("end", () => resolve(rowCount))
      .on("error", (error) => reject(error));
  });
}
