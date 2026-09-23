// Mute chatty console logs
import "_test_utilities/consoleMock";

import { Readable } from "stream";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupationGroupRepository } from "esco/occupationGroup/repository/OccupationGroup.repository";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/getMockRandomData";
import OccupationGroupsToCSVTransform, * as OccupationGroupsToCSVTransformModule from "./OccupationGroupsToCSVTransform";
import { parse } from "csv-parse/sync";
import { ObjectTypes } from "esco/common/objectTypes";
import LanguageAPISpecs from "api-specifications/language";
import { IOccupationGroupWithTranslations } from "esco/occupationGroup/_shared/OccupationGroup.types";
import { ITranslatedStringDoc, TranslatedStringKey } from "common/language/translatedString.types";
import { translatedValueReplacer } from "common/language/translatedFields";

const OccupationGroupRepository = jest.spyOn(getRepositoryRegistry(), "OccupationGroup", "get");

const ENGLISH = LanguageAPISpecs.Helpers.getLanguageByShortCode("en")!;
const FRENCH = LanguageAPISpecs.Helpers.getLanguageByShortCode("fr")!;

// translated in English, and in French for the odd occupationGroups only, so that some translations are missing
const getMockTranslated = (i: number, value: string): ITranslatedStringDoc => {
  const translated: ITranslatedStringDoc = new Map([[ENGLISH.dbKeyName as TranslatedStringKey, value]]);
  if (i % 2) translated.set(FRENCH.dbKeyName as TranslatedStringKey, `fr_${value}`);
  return translated;
};

const getMockOccupationGroups = (
  groupType: ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup
): IOccupationGroupWithTranslations[] => {
  return Array.from<never, IOccupationGroupWithTranslations>({ length: 6 }, (_, i) => ({
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: i % 2 ? [`uuid_${i}_${getTestString(80)}`, `uuid_${i + 1}_${getTestString(80)}`] : [],
    code: `code_${i}`,
    preferredLabel: getMockTranslated(i, `OccupationGroup_${i}_${getTestString(80)}`),
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
    groupType: groupType,
    originUri: `originUri_${i}_${getTestString(80)}`,
    importId: `importId_${i}`,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupOccupationGroupRepositoryMock(findAllWithTranslationsImpl: () => Readable) {
  const mockOccupationGroupRepository: IOccupationGroupRepository = {
    Model: undefined as never,
    hierarchyModel: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    createMany: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findByIds: jest.fn().mockResolvedValue([]),
    findAll: jest.fn(),
    findAllWithTranslations: jest.fn().mockImplementationOnce(findAllWithTranslationsImpl),
    findPaginated: jest.fn().mockResolvedValue({}),
    getOccupationGroupByUUID: jest.fn().mockResolvedValue(null),
    findHistoryReferencesByUUIDs: jest.fn().mockResolvedValue([]),
    findParent: jest.fn().mockResolvedValue(null),
    findChildren: jest.fn().mockResolvedValue([]),
    setEntityEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    setModelEntitiesEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    update: jest.fn(),
    patch: jest.fn(),
    createManyLocalized: jest.fn().mockResolvedValue([]),
  };
  OccupationGroupRepository.mockReturnValue(mockOccupationGroupRepository);
}

describe("OccupationGroupsDoc2csvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each<[ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup, string, LanguageAPISpecs.Types.ILanguageConfig[]]>([
    [ObjectTypes.ISCOGroup, "a single language", [ENGLISH]],
    [ObjectTypes.ISCOGroup, "multiple languages", [ENGLISH, FRENCH]],
    [ObjectTypes.LocalGroup, "a single language", [ENGLISH]],
    [ObjectTypes.LocalGroup, "multiple languages", [ENGLISH, FRENCH]],
  ])(
    "should correctly transform %s OccupationGroup data to CSV for a model with %s",
    async (givenGroupType, _description, givenLanguages) => {
      // GIVEN findAllWithTranslations returns a stream of OccupationGroups
      const givenOccupationGroups = getMockOccupationGroups(givenGroupType);
      setupOccupationGroupRepositoryMock(() => Readable.from(givenOccupationGroups));

      // WHEN the transformation is applied
      const transformedStream = OccupationGroupsToCSVTransform("foo", givenLanguages);

      // THEN the output should be a stream
      const chunks = [];
      for await (const chunk of transformedStream) {
        chunks.push(chunk);
      }
      const actualCSVOutput = chunks.join("");

      // AND the occupationGroups of the given model to have been read with their translations
      expect(getRepositoryRegistry().OccupationGroup.findAllWithTranslations).toHaveBeenCalledWith("foo");

      // AND be a valid CSV
      const parsedObjects = parse(actualCSVOutput, { columns: true });
      // AND contain the occupation data
      expect(parsedObjects).toMatchSnapshot();
      expect(actualCSVOutput).toMatchSnapshot();

      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    }
  );

  test("should export the columns ordered by field first and by the order of the registry second", async () => {
    // GIVEN findAllWithTranslations returns a stream of OccupationGroups
    setupOccupationGroupRepositoryMock(() => Readable.from(getMockOccupationGroups(ObjectTypes.ISCOGroup)));

    // WHEN the transformation is applied for a model in English and French
    const transformedStream = OccupationGroupsToCSVTransform("foo", [ENGLISH, FRENCH]);
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
      "GROUPTYPE",
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

  test("should export a column per language, and a missing translation as an empty string", () => {
    // GIVEN an OccupationGroup that is translated in English only
    const givenOccupationGroup = getMockOccupationGroups(ObjectTypes.ISCOGroup)[0];

    // WHEN the OccupationGroup is transformed for a model in English and French
    const actualRow = OccupationGroupsToCSVTransformModule.transformOccupationGroupSpecToCSVRow(givenOccupationGroup, [
      ENGLISH,
      FRENCH,
    ]);

    // THEN expect every translatable field to have an English column with its value
    expect(actualRow).toMatchObject({
      PREFERREDLABEL_EN: givenOccupationGroup.preferredLabel.get("en"),
      DESCRIPTION_EN: givenOccupationGroup.description.get("en"),
      ALTLABELS_EN: "",
    });
    // AND a French column that is an empty string, not undefined or null
    expect(actualRow).toMatchObject({ PREFERREDLABEL_FR: "", DESCRIPTION_FR: "", ALTLABELS_FR: "" });
    // AND no column that is not suffixed with a language
    expect(actualRow).not.toHaveProperty("PREFERREDLABEL");
  });

  test("should keep the n-th altLabel of every language aligned, a missing translation being an empty line", () => {
    // GIVEN an OccupationGroup whose second altLabel is not translated in French
    const givenOccupationGroup = getMockOccupationGroups(ObjectTypes.ISCOGroup)[1];

    // WHEN the OccupationGroup is transformed for a model in English and French
    const actualRow = OccupationGroupsToCSVTransformModule.transformOccupationGroupSpecToCSVRow(givenOccupationGroup, [
      ENGLISH,
      FRENCH,
    ]);

    // THEN expect both altLabels columns to have the same number of lines
    expect(actualRow.ALTLABELS_EN.split("\n")).toEqual(givenOccupationGroup.altLabels.map((label) => label.get("en")));
    // AND the missing French translation to keep its slot as an empty line
    expect(actualRow.ALTLABELS_FR.split("\n")).toEqual([givenOccupationGroup.altLabels[0].get("fr"), ""]);
  });

  test("should throw an error when the groupType is unknown", async () => {
    // GIVEN a valid OccupationGroup
    const givenOccupationGroup = getMockOccupationGroups(ObjectTypes.ISCOGroup)[0];
    // AND the groupType is unknown
    givenOccupationGroup.groupType = "invalid" as ObjectTypes.ISCOGroup;
    // WHEN the OccupationGroup is transformed
    // THEN expect the given error to be thrown
    expect(() => {
      OccupationGroupsToCSVTransformModule.transformOccupationGroupSpecToCSVRow(givenOccupationGroup, [ENGLISH]);
    }).toThrowErrorMatchingSnapshot();
  });

  describe.each<ObjectTypes.ISCOGroup | ObjectTypes.LocalGroup>([ObjectTypes.ISCOGroup, ObjectTypes.LocalGroup])(
    "should handle errors during stream processing",
    (givenGroupType) => {
      test("should log an error and end the stream when the source repository fails", async () => {
        // GIVEN that the source OccupationGroup stream will emit an error
        const givenError = new Error("Test Error");
        setupOccupationGroupRepositoryMock(
          () =>
            new Readable({
              read() {
                this.emit("error", givenError);
              },
            })
        );

        // WHEN the transformation stream is consumed
        const transformedStream = OccupationGroupsToCSVTransform("foo", [ENGLISH]);
        // THEN expect the given error to be thrown
        await expect(async () => {
          //  iterate to consume the stream
          for await (const _ of transformedStream) {
            // do nothing
          }
        }).rejects.toThrow(givenError);

        // THEN the error should be logged
        const expectedErrorMessage = "Transforming ESCO occupationGroups to CSV failed";
        expect(console.error).toHaveBeenCalledWith(
          expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
        );

        // AND the stream should end
        expect(transformedStream.closed).toBe(true);
      });

      test("should log an error and end the stream when the transformOccupationGroupSpecToCSVRow throws", async () => {
        // GIVEN findAll returns a stream of OccupationGroups
        setupOccupationGroupRepositoryMock(() => Readable.from(getMockOccupationGroups(givenGroupType)));

        // AND  the transformOccupationGroupSpecToCSVRow will throw an error
        const givenError = new Error("Mocked Transformation Error");
        const transformFunctionSpy = jest
          .spyOn(OccupationGroupsToCSVTransformModule, "transformOccupationGroupSpecToCSVRow")
          .mockImplementationOnce(() => {
            throw givenError;
          });

        // WHEN the transformation stream is consumed
        const transformedStream = OccupationGroupsToCSVTransform("foo", [ENGLISH]);

        // THEN expect the given error to be thrown
        await expect(async () => {
          //  iterate to consume the stream
          for await (const _ of transformedStream) {
            // do nothing
          }
        }).rejects.toThrowError("Failed to transform OccupationGroup to CSV row");

        // THEN the error should be logged
        const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], translatedValueReplacer, 2);

        expect(console.error).toHaveBeenCalledWith(
          expect.toMatchErrorWithCause(
            `Failed to transform OccupationGroup to CSV row: ${expectedLoggedItem}`,
            givenError.message
          )
        );
        // AND the stream should end
        expect(transformedStream.closed).toBe(true);
      });
    }
  );
});
