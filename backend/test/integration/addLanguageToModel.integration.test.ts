// mute console.log/warn/error noise from the script's own logging
import "_test_utilities/consoleMock";

import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";
import { Readable } from "node:stream";
import { getNewConnection } from "server/connection/newConnection";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRandomString } from "_test_utilities/getMockRandomData";
import {
  getSimpleNewESCOOccupationSpec,
  getSimpleNewISCOGroupSpec,
  getSimpleNewSkillGroupSpec,
  getSimpleNewSkillSpec,
} from "esco/_test_utilities/getNewSpecs";
import { addLanguageToModel } from "scripts/addLanguageToModel/main";
import { buildExistingEntityMap } from "scripts/addLanguageToModel/csvRowMerge";
import { AddLanguageToModelOptions } from "scripts/addLanguageToModel/types";
import { ITranslatedStringArrayDoc, ITranslatedStringDoc } from "common/language/translatedString.types";

describe("addLanguageToModel against an in-memory mongodb", () => {
  let dbConnection: Connection;
  let tempDir: string;

  beforeAll(async () => {
    // Using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("AddLanguageToModelIntegrationTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    await getRepositoryRegistry().initialize(dbConnection);
  });

  afterAll(async () => {
    await dbConnection.dropDatabase();
    await dbConnection.close(false);
  });

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "add-language-to-model-test-"));
  });

  afterEach(async () => {
    await dbConnection.dropDatabase();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  async function createTestModel() {
    return getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      locale: { UUID: randomUUID(), name: "bar", shortCode: "et" },
      description: "",
      license: getRandomString(10),
      UUIDHistory: [randomUUID()],
    });
  }

  function writeCsv(fileName: string, content: string): string {
    const filePath = path.join(tempDir, fileName);
    fs.writeFileSync(filePath, content, "utf-8");
    return filePath;
  }

  async function getTranslations(
    repository: { findAllWithTranslations: (modelId: string) => Readable },
    modelId: string,
    importId: string
  ) {
    const byImportId = await buildExistingEntityMap((id) => repository.findAllWithTranslations(id), modelId);
    const entity = byImportId.get(importId);
    if (!entity) throw new Error(`test setup error: ${importId} not found`);
    return entity as {
      preferredLabel: ITranslatedStringDoc;
      description: ITranslatedStringDoc;
      altLabels: ITranslatedStringArrayDoc;
      [field: string]: unknown;
    };
  }

  test("should merge French translations into matched entities, skip unmatched rows, and extend availableLanguages, idempotently", async () => {
    // GIVEN a model that was imported with English only
    const givenModel = await createTestModel();

    // AND an occupation group with two existing alt labels (en only)
    const givenOccupationGroupSpec = getSimpleNewISCOGroupSpec(givenModel.id, "Managers");
    givenOccupationGroupSpec.importId = "OG1";
    givenOccupationGroupSpec.altLabels = ["Boss", "Chief"];
    await getRepositoryRegistry().OccupationGroup.createMany([givenOccupationGroupSpec]);

    // AND a second occupation group with no alt labels
    const givenOccupationGroupSpec2 = getSimpleNewISCOGroupSpec(givenModel.id, "Professionals");
    givenOccupationGroupSpec2.importId = "OG2";
    await getRepositoryRegistry().OccupationGroup.createMany([givenOccupationGroupSpec2]);

    // AND an occupation with one existing alt label
    const givenOccupationSpec = getSimpleNewESCOOccupationSpec(givenModel.id, "Cook");
    givenOccupationSpec.importId = "OCC1";
    givenOccupationSpec.altLabels = ["Chef"];
    await getRepositoryRegistry().occupation.createMany([givenOccupationSpec]);

    // AND a skill with one existing alt label
    const givenSkillSpec = getSimpleNewSkillSpec(givenModel.id, "Cooking");
    givenSkillSpec.importId = "SK1";
    givenSkillSpec.altLabels = ["Culinary skill"];
    await getRepositoryRegistry().skill.createMany([givenSkillSpec]);

    // AND a skill group
    const givenSkillGroupSpec = getSimpleNewSkillGroupSpec(givenModel.id, "Culinary skills");
    givenSkillGroupSpec.importId = "SG1";
    await getRepositoryRegistry().skillGroup.createMany([givenSkillGroupSpec]);

    // AND CSV files carrying French translations: OG1 gets 3 alt labels (one more than its 2 existing slots),
    // OG2 gets no alt labels, OG3 matches no entity, and every DESCRIPTION_FR cell is left blank
    const occupationGroupsCsvPath = writeCsv(
      "occupation_groups.csv",
      "ID,PREFERREDLABEL_FR,DESCRIPTION_FR,ALTLABELS_FR\n" +
        'OG1,Directeurs,,"Patron\nChef en second\nExtra"\n' +
        "OG2,Professionnels,,\n" +
        "OG3,Inconnu,,\n"
    );
    const occupationsCsvPath = writeCsv(
      "occupations.csv",
      "ID,PREFERREDLABEL_FR,DEFINITION_FR,DESCRIPTION_FR,SCOPENOTE_FR,REGULATEDPROFESSIONNOTE_FR,ALTLABELS_FR\n" +
        "OCC1,Cuisinier,Prépare la nourriture,,,,Chef cuisinier\n"
    );
    const skillsCsvPath = writeCsv(
      "skills.csv",
      "ID,PREFERREDLABEL_FR,DEFINITION_FR,DESCRIPTION_FR,SCOPENOTE_FR,ALTLABELS_FR\n" +
        "SK1,Cuisine,,,,Compétence culinaire\n"
    );
    const skillGroupsCsvPath = writeCsv(
      "skill_groups.csv",
      "ID,PREFERREDLABEL_FR,DESCRIPTION_FR,SCOPENOTE_FR,ALTLABELS_FR\n" + "SG1,Compétences culinaires,,,\n"
    );

    const baseOptions: AddLanguageToModelOptions = {
      modelId: givenModel.id,
      languageShortCode: "fr",
      occupationGroupsCsvPath,
      occupationsCsvPath,
      skillsCsvPath,
      skillGroupsCsvPath,
      outputFolderPath: tempDir,
    };

    // WHEN the script is run in dry run mode
    const actualDryRunResult = await addLanguageToModel({
      ...baseOptions,
      outputFileName: "dry-run.json",
      dryRun: true,
    });

    // THEN it reports the matched, unmatched and would-change counts without writing anything
    expect(actualDryRunResult.dryRun).toBe(true);
    expect(actualDryRunResult.entities.occupationGroups).toMatchObject({
      totalRows: 3,
      matched: 2,
      unmatched: 1,
      unmatchedImportIds: ["OG3"],
      changed: 2,
      unchanged: 0,
    });
    expect(
      actualDryRunResult.entities.occupationGroups.warnings.some((w) => w.includes("extra label(s) were ignored"))
    ).toBe(true);
    expect(actualDryRunResult.entities.occupations).toMatchObject({
      totalRows: 1,
      matched: 1,
      changed: 1,
      unmatched: 0,
    });
    expect(actualDryRunResult.entities.skills).toMatchObject({ totalRows: 1, matched: 1, changed: 1, unmatched: 0 });
    expect(actualDryRunResult.entities.skillGroups).toMatchObject({
      totalRows: 1,
      matched: 1,
      changed: 1,
      unmatched: 0,
    });
    expect(actualDryRunResult.availableLanguagesUpdated).toBe(false);

    // AND the report file was written with the same result
    const actualDryRunReportOnDisk = JSON.parse(
      await fs.promises.readFile(path.join(tempDir, "dry-run.json"), "utf-8")
    );
    expect(actualDryRunReportOnDisk.totals).toEqual(actualDryRunResult.totals);

    // AND nothing was actually written to the database: the model still only carries English
    const actualModelAfterDryRun = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualModelAfterDryRun?.availableLanguages).toEqual(["en"]);
    const actualOG1AfterDryRun = await getTranslations(getRepositoryRegistry().OccupationGroup, givenModel.id, "OG1");
    expect(actualOG1AfterDryRun.preferredLabel.has("fr")).toBe(false);

    // WHEN the script is run for real with the same input
    const actualResult = await addLanguageToModel({ ...baseOptions, outputFileName: "report.json", dryRun: false });

    // THEN it reports the same counts as the dry run
    expect(actualResult.entities.occupationGroups).toMatchObject({
      totalRows: 3,
      matched: 2,
      unmatched: 1,
      unmatchedImportIds: ["OG3"],
      changed: 2,
      unchanged: 0,
    });
    expect(actualResult.totals).toEqual({
      totalRows: 6,
      matched: 5,
      unmatched: 1,
      changed: 5,
      unchanged: 0,
      writeFailures: 0,
    });

    // AND availableLanguages was extended, without dropping English
    expect(actualResult.availableLanguagesUpdated).toBe(true);
    const actualModelAfterRun = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualModelAfterRun?.availableLanguages).toEqual(["en", "fr"]);

    // AND the new language was merged into OG1's translatable fields, in every existing alt label slot it fits,
    // while the existing English translations and the untouched description field are left exactly as they were
    const actualOG1 = await getTranslations(getRepositoryRegistry().OccupationGroup, givenModel.id, "OG1");
    expect(actualOG1.preferredLabel.get("fr")).toBe("Directeurs");
    expect(actualOG1.preferredLabel.get("en")).toBe("Managers");
    expect(actualOG1.description.has("fr")).toBe(false);
    expect(actualOG1.altLabels).toHaveLength(2);
    expect(actualOG1.altLabels[0].get("en")).toBe("Boss");
    expect(actualOG1.altLabels[0].get("fr")).toBe("Patron");
    expect(actualOG1.altLabels[1].get("en")).toBe("Chief");
    expect(actualOG1.altLabels[1].get("fr")).toBe("Chef en second");

    // AND OG2, which had no alt labels to begin with, only got its preferredLabel merged
    const actualOG2 = await getTranslations(getRepositoryRegistry().OccupationGroup, givenModel.id, "OG2");
    expect(actualOG2.preferredLabel.get("fr")).toBe("Professionnels");
    expect(actualOG2.altLabels).toHaveLength(0);

    // AND the occupation, skill and skill group were merged the same way
    const actualOccupation = await getTranslations(getRepositoryRegistry().occupation, givenModel.id, "OCC1");
    expect(actualOccupation.preferredLabel.get("fr")).toBe("Cuisinier");
    expect((actualOccupation.definition as ITranslatedStringDoc).get("fr")).toBe("Prépare la nourriture");
    expect(actualOccupation.altLabels[0].get("fr")).toBe("Chef cuisinier");
    expect(actualOccupation.altLabels[0].get("en")).toBe("Chef");

    const actualSkill = await getTranslations(getRepositoryRegistry().skill, givenModel.id, "SK1");
    expect(actualSkill.preferredLabel.get("fr")).toBe("Cuisine");
    expect(actualSkill.altLabels[0].get("fr")).toBe("Compétence culinaire");

    const actualSkillGroup = await getTranslations(getRepositoryRegistry().skillGroup, givenModel.id, "SG1");
    expect(actualSkillGroup.preferredLabel.get("fr")).toBe("Compétences culinaires");

    // WHEN the exact same script run is repeated
    const actualSecondRunResult = await addLanguageToModel({
      ...baseOptions,
      outputFileName: "report-2.json",
      dryRun: false,
    });

    // THEN it is idempotent: every entity is still matched, but nothing changed, and availableLanguages was not
    // updated again since French is already listed
    expect(actualSecondRunResult.totals).toEqual({
      totalRows: 6,
      matched: 5,
      unmatched: 1,
      changed: 0,
      unchanged: 5,
      writeFailures: 0,
    });
    expect(actualSecondRunResult.availableLanguagesUpdated).toBe(false);
    const actualModelAfterSecondRun = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualModelAfterSecondRun?.availableLanguages).toEqual(["en", "fr"]);
  });

  test("should not mark the language available when a database write fails, but should still write the report", async () => {
    // GIVEN a model with one occupation group
    const givenModel = await createTestModel();
    const givenOccupationGroupSpec = getSimpleNewISCOGroupSpec(givenModel.id, "Managers");
    givenOccupationGroupSpec.importId = "OG1";
    await getRepositoryRegistry().OccupationGroup.createMany([givenOccupationGroupSpec]);

    // AND a CSV with a French translation for it
    const occupationGroupsCsvPath = writeCsv(
      "occupation_groups.csv",
      "ID,PREFERREDLABEL_FR,DESCRIPTION_FR,ALTLABELS_FR\nOG1,Directeurs,,\n"
    );

    // AND the database write for this entity type is going to fail, the same way a transient connection error
    // or a bulkWrite failure would
    const bulkSetTranslatedFieldsSpy = jest
      .spyOn(getRepositoryRegistry().OccupationGroup, "bulkSetTranslatedFields")
      .mockRejectedValueOnce(new Error("simulated bulkWrite failure"));

    // WHEN the script is run for real
    const actualPromise = addLanguageToModel({
      modelId: givenModel.id,
      languageShortCode: "fr",
      occupationGroupsCsvPath,
      outputFolderPath: tempDir,
      outputFileName: "write-failure-report.json",
    });

    // THEN it rejects, since the database cannot be confirmed to hold what the report would otherwise claim
    await expect(actualPromise).rejects.toThrow(/row\(s\) failed to write/);

    // AND the report was still written to disk, with the failure visible in it
    const actualReportOnDisk = JSON.parse(
      await fs.promises.readFile(path.join(tempDir, "write-failure-report.json"), "utf-8")
    );
    expect(actualReportOnDisk.entities.occupationGroups.writeFailures).toBe(1);
    expect(actualReportOnDisk.totals.writeFailures).toBe(1);
    expect(actualReportOnDisk.availableLanguagesUpdated).toBe(false);

    // AND availableLanguages was NOT extended, since the translation was never confirmed as written
    const actualModel = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualModel?.availableLanguages).toEqual(["en"]);

    bulkSetTranslatedFieldsSpy.mockRestore();
  });

  test("should not treat a matched-but-unmodified write as a failure", async () => {
    // GIVEN a model with one occupation group
    const givenModel = await createTestModel();
    const givenOccupationGroupSpec = getSimpleNewISCOGroupSpec(givenModel.id, "Managers");
    givenOccupationGroupSpec.importId = "OG1";
    await getRepositoryRegistry().OccupationGroup.createMany([givenOccupationGroupSpec]);

    // AND a CSV with a French translation for it
    const occupationGroupsCsvPath = writeCsv(
      "occupation_groups.csv",
      "ID,PREFERREDLABEL_FR,DESCRIPTION_FR,ALTLABELS_FR\nOG1,Directeurs,,\n"
    );

    // AND the database reports the document as matched but not modified, the same way it would if another
    // process (or a duplicate CSV row in the same batch) had already written the exact same value
    const bulkSetTranslatedFieldsSpy = jest
      .spyOn(getRepositoryRegistry().OccupationGroup, "bulkSetTranslatedFields")
      .mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 0 });

    // WHEN the script is run for real
    const actualResult = await addLanguageToModel({
      modelId: givenModel.id,
      languageShortCode: "fr",
      occupationGroupsCsvPath,
      outputFolderPath: tempDir,
      outputFileName: "matched-not-modified-report.json",
    });

    // THEN it does not treat the matched-but-unmodified write as a failure
    expect(actualResult.entities.occupationGroups.writeFailures).toBe(0);
    expect(actualResult.totals.writeFailures).toBe(0);

    // AND availableLanguages was still extended, since nothing actually failed
    expect(actualResult.availableLanguagesUpdated).toBe(true);
    const actualModel = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualModel?.availableLanguages).toEqual(["en", "fr"]);

    bulkSetTranslatedFieldsSpy.mockRestore();
  });

  test("should reject a CSV with the wrong language's columns even when it has no data rows", async () => {
    // GIVEN a model with one occupation group
    const givenModel = await createTestModel();
    const givenOccupationGroupSpec = getSimpleNewISCOGroupSpec(givenModel.id, "Managers");
    givenOccupationGroupSpec.importId = "OG1";
    await getRepositoryRegistry().OccupationGroup.createMany([givenOccupationGroupSpec]);

    // AND a CSV carrying only Spanish columns, with no data rows at all
    const occupationGroupsCsvPath = writeCsv(
      "occupation_groups.csv",
      "ID,PREFERREDLABEL_ES,DESCRIPTION_ES,ALTLABELS_ES\n"
    );

    // WHEN the script is run asking to add French from that CSV
    const actualPromise = addLanguageToModel({
      modelId: givenModel.id,
      languageShortCode: "fr",
      occupationGroupsCsvPath,
      outputFolderPath: tempDir,
    });

    // THEN it rejects: an empty-but-wrong-language file must not be silently treated as "nothing to do"
    await expect(actualPromise).rejects.toThrow(/CSV headers failed validation/);

    // AND availableLanguages was not touched
    const actualModel = await getRepositoryRegistry().modelInfo.getModelById(givenModel.id);
    expect(actualModel?.availableLanguages).toEqual(["en"]);
  });

  test("should throw when no entity CSV file is provided", async () => {
    // GIVEN a model
    const givenModel = await createTestModel();

    // WHEN the script is run without any of the four entity CSV options
    const actualPromise = addLanguageToModel({
      modelId: givenModel.id,
      languageShortCode: "fr",
      outputFolderPath: tempDir,
    });

    // THEN it rejects rather than silently doing nothing
    await expect(actualPromise).rejects.toThrow(/At least one entity CSV file must be provided/);
  });

  test("should throw when the model does not exist", async () => {
    // GIVEN a CSV file for a model that does not exist
    const occupationGroupsCsvPath = writeCsv(
      "occupation_groups.csv",
      "ID,PREFERREDLABEL_FR,DESCRIPTION_FR,ALTLABELS_FR\nOG1,Directeurs,,\n"
    );

    // WHEN the script is run against a well-formed but non-existent modelId
    const actualPromise = addLanguageToModel({
      modelId: "507f1f77bcf86cd799439011",
      languageShortCode: "fr",
      occupationGroupsCsvPath,
      outputFolderPath: tempDir,
    });

    // THEN it rejects rather than silently doing nothing
    await expect(actualPromise).rejects.toThrow(/Model not found/);
  });
});
