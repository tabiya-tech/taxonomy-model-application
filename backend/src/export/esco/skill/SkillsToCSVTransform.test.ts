// Mute chatty console logs
import "_test_utilities/consoleMock";

import { Readable } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/getMockRandomData";
import SkillsToCSVTransform, * as SKillsToCSVTransformModule from "./SkillsToCSVTransform";
import { parse } from "csv-parse/sync";
import { ISkillWithTranslations, ReuseLevel, SkillType } from "esco/skill/_shared/skill.types";
import LanguageAPISpecs from "api-specifications/language";
import { ITranslatedStringDoc, TranslatedStringKey } from "common/language/translatedString.types";
import { translatedValueReplacer } from "common/language/translatedFields";

const SkillRepository = jest.spyOn(getRepositoryRegistry(), "skill", "get");

const ENGLISH = LanguageAPISpecs.Helpers.getLanguageByShortCode("en")!;
const FRENCH = LanguageAPISpecs.Helpers.getLanguageByShortCode("fr")!;

// translated in English, and in French for the odd skills only, so that some translations are missing
const getMockTranslated = (i: number, value: string): ITranslatedStringDoc => {
  const translated: ITranslatedStringDoc = new Map([[ENGLISH.dbKeyName as TranslatedStringKey, value]]);
  if (i % 2) translated.set(FRENCH.dbKeyName as TranslatedStringKey, `fr_${value}`);
  return translated;
};

const getMockSkills = (): ISkillWithTranslations[] => {
  const getReuseLevel = (i: number) => {
    switch (i % 5) {
      case 0:
        return ReuseLevel.Transversal;
      case 1:
        return ReuseLevel.CrossSector;
      case 2:
        return ReuseLevel.OccupationSpecific;
      case 3:
        return ReuseLevel.SectorSpecific;
      default:
        return ReuseLevel.None;
    }
  };
  const getSkillType = (i: number) => {
    switch (i % 5) {
      case 0:
        return SkillType.Knowledge;
      case 1:
        return SkillType.Language;
      case 2:
        return SkillType.Attitude;
      case 3:
        return SkillType.SkillCompetence;
      default:
        return SkillType.None;
    }
  };
  const givenLength = 6;
  // ensure that we have enough elements to test all skill types and reuse levels
  expect(givenLength).toBeGreaterThanOrEqual(Object.values(SkillType).length);
  expect(givenLength).toBeGreaterThanOrEqual(Object.values(ReuseLevel).length);
  return Array.from<never, ISkillWithTranslations>({ length: givenLength }, (_, i) => ({
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: i % 2 ? [`uuidHistory_${i}_${getTestString(80)}`, `uuidHistory_${i + 1}_${getTestString(80)}`] : [],
    preferredLabel: getMockTranslated(i, `Skill_${i}_${getTestString(80)}`),
    // the second altLabel is never translated in French, it keeps its slot as an empty line
    altLabels:
      i % 2
        ? [
            getMockTranslated(i, `altLabel_1_${getTestString(80)}`),
            new Map([[ENGLISH.dbKeyName as TranslatedStringKey, `altLabel_2_${getTestString(80)}`]]),
          ]
        : [],
    description: getMockTranslated(i, `description_${i}_${getTestString(80)}`),
    definition: getMockTranslated(i, `definition_${i}_${getTestString(80)}`),
    modelId: getMockStringId(1),
    originUri: `originUri_${i}_${getTestString(80)}`,
    scopeNote: getMockTranslated(i, `scopeNote_${i}_${getTestString(80)}`),
    importId: `importId_${i}`,
    skillType: getSkillType(i), // we should test all skill types, so we have to ensure that the length of the array is >= 5
    reuseLevel: getReuseLevel(i), // we should test all skill types, so we have to ensure that the length of the array is >= 5
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
    isLocalized: i % 2 === 0,
  }));
};

function setupSkillRepositoryMock(findAllWithTranslationsImpl: () => Readable) {
  const mockSkillRepository: ISkillRepository = {
    Model: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    createMany: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn(),
    findAllWithTranslations: jest.fn().mockImplementationOnce(findAllWithTranslationsImpl),
    findPaginated: jest.fn(),
    findByIds: jest.fn(),
    findParents: jest.fn(),
    findChildren: jest.fn(),
    findOccupationsForSkill: jest.fn(),
    findRelatedSkills: jest.fn(),
    findHistoryReferencesByUUIDs: jest.fn(),
    update: jest.fn(),
    patch: jest.fn(),
    setEntityEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    setModelEntitiesEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    createManyLocalized: jest.fn().mockResolvedValue([]),
  };
  SkillRepository.mockReturnValue(mockSkillRepository);
}

describe("SkillsDocToCsvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("test transformSkillSpecToCSVRow()", () => {
    test("should transform a Skill to a CSV row", () => {
      // GIVEN a valid Skill
      const givenSill = getMockSkills()[1];
      // WHEN the Skill is transformed for a model in English and French
      const actualRow = SKillsToCSVTransformModule.transformSkillSpecToCSVRow(givenSill, [ENGLISH, FRENCH]);
      // THEN the CSV row should be correct
      expect(actualRow).toMatchSnapshot();
    });

    test("should export a column per language, and a missing translation as an empty string", () => {
      // GIVEN a Skill that is translated in English only
      const givenSkill = getMockSkills()[0];

      // WHEN the Skill is transformed for a model in English and French
      const actualRow = SKillsToCSVTransformModule.transformSkillSpecToCSVRow(givenSkill, [ENGLISH, FRENCH]);

      // THEN expect every translatable field to have an English column with its value
      expect(actualRow).toMatchObject({
        PREFERREDLABEL_EN: givenSkill.preferredLabel.get("en"),
        DESCRIPTION_EN: givenSkill.description.get("en"),
        DEFINITION_EN: givenSkill.definition.get("en"),
        SCOPENOTE_EN: givenSkill.scopeNote.get("en"),
        ALTLABELS_EN: "",
      });
      // AND a French column that is an empty string, not undefined or null
      expect(actualRow).toMatchObject({
        PREFERREDLABEL_FR: "",
        DESCRIPTION_FR: "",
        DEFINITION_FR: "",
        SCOPENOTE_FR: "",
        ALTLABELS_FR: "",
      });
      // AND no column that is not suffixed with a language
      expect(actualRow).not.toHaveProperty("PREFERREDLABEL");
    });

    test("should keep the n-th altLabel of every language aligned, a missing translation being an empty line", () => {
      // GIVEN a Skill whose second altLabel is not translated in French
      const givenSkill = getMockSkills()[1];

      // WHEN the Skill is transformed for a model in English and French
      const actualRow = SKillsToCSVTransformModule.transformSkillSpecToCSVRow(givenSkill, [ENGLISH, FRENCH]);

      // THEN expect both altLabels columns to have the same number of lines
      expect(actualRow.ALTLABELS_EN.split("\n")).toEqual(givenSkill.altLabels.map((label) => label.get("en")));
      // AND the missing French translation to keep its slot as an empty line
      expect(actualRow.ALTLABELS_FR.split("\n")).toEqual([givenSkill.altLabels[0].get("fr"), ""]);
    });

    test("should throw an error when the reuseLevel is unknown", async () => {
      // GIVEN an otherwise valid Skill
      const givenSill = getMockSkills()[0];
      // WITH an unknown reuseLevel
      givenSill.reuseLevel = "foo" as ReuseLevel;
      // WHEN the Skill is transformed
      const transformCall = () => SKillsToCSVTransformModule.transformSkillSpecToCSVRow(givenSill, [ENGLISH]);
      // THEN the transformation should throw an error
      expect(transformCall).toThrowError("Failed to transform Skill to CSV row: Invalid reuseLevel: foo");
    });

    test("should throw an error when the skillType is unknown", async () => {
      // GIVEN an otherwise valid Skill
      const givenSill = getMockSkills()[0];
      // WITH an unknown skillType
      givenSill.skillType = "foo" as SkillType;
      // WHEN the Skill is transformed
      const transformCall = () => SKillsToCSVTransformModule.transformSkillSpecToCSVRow(givenSill, [ENGLISH]);
      // THEN the transformation should throw an error
      expect(transformCall).toThrowError("Failed to transform Skill to CSV row: Invalid skillType: foo");
    });
  });

  test.each([
    ["a single language", [ENGLISH]],
    ["multiple languages", [ENGLISH, FRENCH]],
  ])("should correctly transform Skill data to CSV for a model with %s", async (_description, givenLanguages) => {
    // GIVEN findAllWithTranslations returns a stream of Skills
    const givenSkills = getMockSkills();
    setupSkillRepositoryMock(() => Readable.from(givenSkills));

    // WHEN the transformation is applied
    const transformedStream = SkillsToCSVTransform("foo", givenLanguages);

    // THEN the output should be a stream
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }
    const actualCSVOutput = chunks.join("");

    // AND the skills of the given model to have been read with their translations
    expect(getRepositoryRegistry().skill.findAllWithTranslations).toHaveBeenCalledWith("foo");

    // AND be a valid CSV
    const parsedObjects = parse(actualCSVOutput, { columns: true });
    // AND contain the occupation data
    expect(parsedObjects).toMatchSnapshot();
    expect(actualCSVOutput).toMatchSnapshot();

    // AND the stream should end
    expect(transformedStream.closed).toBe(true);
  });

  test("should export the columns ordered by field first and by the order of the registry second", async () => {
    // GIVEN findAllWithTranslations returns a stream of Skills
    setupSkillRepositoryMock(() => Readable.from(getMockSkills()));

    // WHEN the transformation is applied for a model in English and French
    const transformedStream = SkillsToCSVTransform("foo", [ENGLISH, FRENCH]);
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }

    // THEN expect the header of the CSV to have a column per translatable field and language
    const [actualHeader] = parse(chunks.join(""), { to_line: 1 });
    expect(actualHeader).toEqual([
      "ID",
      "ORIGINURI",
      "UUIDHISTORY",
      "DEFINITION_EN",
      "DEFINITION_FR",
      "SCOPENOTE_EN",
      "SCOPENOTE_FR",
      "REUSELEVEL",
      "SKILLTYPE",
      "PREFERREDLABEL_EN",
      "PREFERREDLABEL_FR",
      "ALTLABELS_EN",
      "ALTLABELS_FR",
      "DESCRIPTION_EN",
      "DESCRIPTION_FR",
      "ISLOCALIZED",
      "CREATEDAT",
      "UPDATEDAT",
    ]);
  });

  describe("should handle errors during stream processing", () => {
    test("should log an error and end the stream when the source repository fails", async () => {
      // GIVEN that the source Skill stream will emit an error
      const givenError = new Error("Test Error");
      setupSkillRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = SkillsToCSVTransform("foo", [ENGLISH]);
      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrow(givenError);
      // AND the error to be logged
      const expectedErrorMessage = "Transforming Skills to CSV failed";
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });

    test("should log an error and end the stream when the transformSkillSpecToCSVRow throws", async () => {
      // GIVEN findAll will return a stream of Skills
      setupSkillRepositoryMock(() => Readable.from(getMockSkills()));
      // AND  the transformISCOSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      const transformFunctionSpy = jest
        .spyOn(SKillsToCSVTransformModule, "transformSkillSpecToCSVRow")
        .mockImplementationOnce((_: ISkillWithTranslations) => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = SkillsToCSVTransform("foo", [ENGLISH]);

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform Skill to CSV row");
      // AND the error to be logged
      const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], translatedValueReplacer, 2);
      const expectedErrorMessage = `Failed to transform Skill to CSV row: ${expectedLoggedItem}`;

      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
