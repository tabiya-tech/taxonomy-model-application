// Mute chatty console logs
import "_test_utilities/consoleMock";

import { Readable } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkillGroupRepository } from "esco/skillGroup/repository/SkillGroup.repository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/getMockRandomData";
import SkillGroupsToCSVTransform, * as SKillGroupsToCSVTransformModule from "./SkillGroupsToCSVTransform";
import { parse } from "csv-parse/sync";
import LanguageAPISpecs from "api-specifications/language";
import { ISkillGroupWithTranslations } from "esco/skillGroup/_shared/skillGroup.types";
import { ITranslatedStringDoc, TranslatedStringKey } from "common/language/translatedString.types";
import { translatedValueReplacer } from "common/language/translatedFields";

const SkillGroupRepository = jest.spyOn(getRepositoryRegistry(), "skillGroup", "get");

const ENGLISH = LanguageAPISpecs.Helpers.getLanguageByShortCode("en")!;
const FRENCH = LanguageAPISpecs.Helpers.getLanguageByShortCode("fr")!;

// translated in English, and in French for the odd skillGroups only, so that some translations are missing
const getMockTranslated = (i: number, value: string): ITranslatedStringDoc => {
  const translated: ITranslatedStringDoc = new Map([[ENGLISH.dbKeyName as TranslatedStringKey, value]]);
  if (i % 2) translated.set(FRENCH.dbKeyName as TranslatedStringKey, `fr_${value}`);
  return translated;
};

const getMockSkillGroups = (): ISkillGroupWithTranslations[] => {
  return Array.from<never, ISkillGroupWithTranslations>({ length: 6 }, (_, i) => ({
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: i % 2 ? [`uuidHistory_1_${getTestString(80)}`, `uuidHistory_2_${getTestString(80)}`] : [],
    code: `code_${i}`,
    preferredLabel: getMockTranslated(i, `SkillGroup_${i}_${getTestString(80)}`),
    // the second altLabel is never translated in French, it keeps its slot as an empty line
    altLabels:
      i % 2
        ? [
            getMockTranslated(i, `altLabel_1_${getTestString(80)}`),
            new Map([[ENGLISH.dbKeyName as TranslatedStringKey, `altLabel_2_${getTestString(80)}`]]),
          ]
        : [],
    description: getMockTranslated(i, `description_${i}_${getTestString(80)}`),
    modelId: getMockStringId(1),
    originUri: `originUri_${i}_${getTestString(80)}`,
    scopeNote: getMockTranslated(i, `scopeNote_${i}_${getTestString(80)}`),
    importId: `importId_${i}`,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupSkillGroupRepositoryMock(findAllWithTranslationsImpl: () => Readable) {
  const mockSkillGroupRepository: ISkillGroupRepository = {
    Model: undefined as never,
    hierarchyModel: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    findByIds: jest.fn().mockResolvedValue([]),
    findPaginated: jest.fn().mockResolvedValue(null),
    createMany: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findAll: jest.fn(),
    findAllWithTranslations: jest.fn().mockImplementationOnce(findAllWithTranslationsImpl),
    findParents: jest.fn().mockResolvedValue([]),
    findChildren: jest.fn().mockResolvedValue([]),
    findHistoryReferencesByUUIDs: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(null),
    patch: jest.fn().mockResolvedValue(null),
    setEntityEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    setModelEntitiesEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    createManyLocalized: jest.fn().mockResolvedValue([]),
  };
  SkillGroupRepository.mockReturnValue(mockSkillGroupRepository);
}

describe("SkillGroupsDocToCsvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("test transformSkillGroupSpecToCSVRow()", () => {
    test("should transform a SkillGroup to a CSV row", () => {
      // GIVEN a valid SkillGroup
      const givenSkillGroup = getMockSkillGroups()[1];
      // WHEN the SkillGroup is transformed for a model in English and French
      const actualRow = SKillGroupsToCSVTransformModule.transformSkillGroupSpecToCSVRow(givenSkillGroup, [
        ENGLISH,
        FRENCH,
      ]);
      // THEN the CSV row should be correct
      expect(actualRow).toMatchSnapshot();
    });

    test("should export a column per language, and a missing translation as an empty string", () => {
      // GIVEN a SkillGroup that is translated in English only
      const givenSkillGroup = getMockSkillGroups()[0];

      // WHEN the SkillGroup is transformed for a model in English and French
      const actualRow = SKillGroupsToCSVTransformModule.transformSkillGroupSpecToCSVRow(givenSkillGroup, [
        ENGLISH,
        FRENCH,
      ]);

      // THEN expect every translatable field to have an English column with its value
      expect(actualRow).toMatchObject({
        PREFERREDLABEL_EN: givenSkillGroup.preferredLabel.get("en"),
        DESCRIPTION_EN: givenSkillGroup.description.get("en"),
        SCOPENOTE_EN: givenSkillGroup.scopeNote.get("en"),
        ALTLABELS_EN: "",
      });
      // AND a French column that is an empty string, not undefined or null
      expect(actualRow).toMatchObject({
        PREFERREDLABEL_FR: "",
        DESCRIPTION_FR: "",
        SCOPENOTE_FR: "",
        ALTLABELS_FR: "",
      });
      // AND no column that is not suffixed with a language
      expect(actualRow).not.toHaveProperty("PREFERREDLABEL");
    });

    test("should keep the n-th altLabel of every language aligned, a missing translation being an empty line", () => {
      // GIVEN a SkillGroup whose second altLabel is not translated in French
      const givenSkillGroup = getMockSkillGroups()[1];

      // WHEN the SkillGroup is transformed for a model in English and French
      const actualRow = SKillGroupsToCSVTransformModule.transformSkillGroupSpecToCSVRow(givenSkillGroup, [
        ENGLISH,
        FRENCH,
      ]);

      // THEN expect both altLabels columns to have the same number of lines
      expect(actualRow.ALTLABELS_EN.split("\n")).toEqual(givenSkillGroup.altLabels.map((label) => label.get("en")));
      // AND the missing French translation to keep its slot as an empty line
      expect(actualRow.ALTLABELS_FR.split("\n")).toEqual([givenSkillGroup.altLabels[0].get("fr"), ""]);
    });
  });

  test.each([
    ["a single language", [ENGLISH]],
    ["multiple languages", [ENGLISH, FRENCH]],
  ])("should correctly transform SkillGroup data to CSV for a model with %s", async (_description, givenLanguages) => {
    // GIVEN findAllWithTranslations returns a stream of SkillGroups
    const givenSkillGroups = getMockSkillGroups();
    setupSkillGroupRepositoryMock(() => Readable.from(givenSkillGroups));

    // WHEN the transformation is applied
    const transformedStream = SkillGroupsToCSVTransform("foo", givenLanguages);

    // THEN the output should be a stream
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }
    const actualCSVOutput = chunks.join("");

    // AND the skillGroups of the given model to have been read with their translations
    expect(getRepositoryRegistry().skillGroup.findAllWithTranslations).toHaveBeenCalledWith("foo");

    // AND be a valid CSV
    const parsedObjects = parse(actualCSVOutput, { columns: true });
    // AND contain the skillGroup data
    expect(parsedObjects).toMatchSnapshot();
    expect(actualCSVOutput).toMatchSnapshot();

    // AND the stream should end
    expect(transformedStream.closed).toBe(true);
  });

  test("should export the columns ordered by field first and by the order of the registry second", async () => {
    // GIVEN findAllWithTranslations returns a stream of SkillGroups
    setupSkillGroupRepositoryMock(() => Readable.from(getMockSkillGroups()));

    // WHEN the transformation is applied for a model in English and French
    const transformedStream = SkillGroupsToCSVTransform("foo", [ENGLISH, FRENCH]);
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
      "CODE",
      "SCOPENOTE_EN",
      "SCOPENOTE_FR",
      "PREFERREDLABEL_EN",
      "PREFERREDLABEL_FR",
      "ALTLABELS_EN",
      "ALTLABELS_FR",
      "DESCRIPTION_EN",
      "DESCRIPTION_FR",
      "CREATEDAT",
      "UPDATEDAT",
    ]);
  });

  describe("should handle errors during stream processing", () => {
    test("should log an error and end the stream when the source repository fails", async () => {
      // GIVEN that the source SkillGroup stream will emit an error
      const givenError = new Error("Test Error");
      setupSkillGroupRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = SkillGroupsToCSVTransform("foo", [ENGLISH]);
      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrow(givenError);
      // AND the error to be logged
      const expectedErrorMessage = "Transforming SkillGroups to CSV failed";
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });

    test("should log an error and end the stream when the transformSkillGroupSpecToCSVRow throws", async () => {
      // GIVEN findAllWithTranslations will return a stream of SkillGroups
      setupSkillGroupRepositoryMock(() => Readable.from(getMockSkillGroups()));
      // AND  the transformSkillGroupSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      const transformFunctionSpy = jest
        .spyOn(SKillGroupsToCSVTransformModule, "transformSkillGroupSpecToCSVRow")
        .mockImplementationOnce(() => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = SkillGroupsToCSVTransform("foo", [ENGLISH]);

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform SkillGroup to CSV row");
      // AND the error to be logged
      const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], translatedValueReplacer, 2);
      const expectedErrorMessage = `Failed to transform SkillGroup to CSV row: ${expectedLoggedItem}`;

      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
