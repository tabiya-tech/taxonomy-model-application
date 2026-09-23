// Mute chatty console logs
import "_test_utilities/consoleMock";

import { Readable } from "stream";
import * as BaseOccupationsToCSVTransformModule from "./OccupationsToCSVTransform";
import OccupationsToCSVTransform from "./OccupationsToCSVTransform";
import LanguageAPISpecs from "api-specifications/language";
import { IOccupationWithTranslations } from "esco/occupations/_shared/occupation.types";
import { ITranslatedStringDoc, TranslatedStringKey } from "common/language/translatedString.types";
import { translatedValueReplacer } from "common/language/translatedFields";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { IOccupationRepository } from "esco/occupations/repository/occupation.repository";
import { parse } from "csv-parse/sync";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getTestString } from "_test_utilities/getMockRandomData";
import { ObjectTypes } from "esco/common/objectTypes";

const OccupationRepositorySpy = jest.spyOn(getRepositoryRegistry(), "occupation", "get");

const ENGLISH = LanguageAPISpecs.Helpers.getLanguageByShortCode("en")!;
const FRENCH = LanguageAPISpecs.Helpers.getLanguageByShortCode("fr")!;

// translated in English, and in French for the odd occupations only, so that some translations are missing
const getMockTranslated = (i: number, value: string): ITranslatedStringDoc => {
  const translated: ITranslatedStringDoc = new Map([[ENGLISH.dbKeyName as TranslatedStringKey, value]]);
  if (i % 2) translated.set(FRENCH.dbKeyName as TranslatedStringKey, `fr_${value}`);
  return translated;
};

const getMockOccupations = (
  occupationType: ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation
): IOccupationWithTranslations[] => {
  return Array.from<never, IOccupationWithTranslations>({ length: 6 }, (_, i) => ({
    id: getMockStringId(i),
    UUID: `uuid_${i}`,
    UUIDHistory: i % 2 ? [`uuid_${i}_${getTestString(80)}`] : [],
    occupationGroupCode: `OccupationGroupCode_${i}`,
    definition: getMockTranslated(i, `definition_${i}_${getTestString(80)}`),
    regulatedProfessionNote: getMockTranslated(i, `regulatedProfessionNote_${i}_${getTestString(80)}`),
    scopeNote: getMockTranslated(i, `scopeNote_${i}_${getTestString(80)}`),
    // the second altLabel is never translated in French, it keeps its slot as an empty line
    altLabels:
      i % 2
        ? [
            getMockTranslated(i, `altLabel_1_${getTestString(80)}`),
            new Map([[ENGLISH.dbKeyName as TranslatedStringKey, `altLabel_2_${getTestString(80)}`]]),
          ]
        : [],
    code: `code_${i}`,
    preferredLabel: getMockTranslated(i, `Occupation_${i}_${getTestString(80)}`),
    modelId: getMockStringId(1),
    originUri: `originUri_${i}_${getTestString(80)}`,
    description: getMockTranslated(i, `description_${i}_${getTestString(80)}`),
    importId: `importId_${i}`,
    occupationType: occupationType,
    isLocalized: occupationType === ObjectTypes.LocalOccupation ? true : i % 2 === 0,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupOccupationRepositoryMock(findAllWithTranslationsImpl: () => Readable) {
  const mockOccupationRepository: IOccupationRepository = {
    Model: undefined as never,
    create: jest.fn().mockResolvedValue(null),
    createMany: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue(null),
    findByIds: jest.fn().mockResolvedValue([]),
    findAll: jest.fn(),
    findAllWithTranslations: jest.fn().mockImplementationOnce(findAllWithTranslationsImpl),
    findPaginated: jest.fn().mockResolvedValue({}),
    getOccupationByUUID: jest.fn().mockResolvedValue(null),
    findHistoryReferencesByUUIDs: jest.fn(),
    findParent: jest.fn(),
    findChildren: jest.fn(),
    findSkillsForOccupation: jest.fn(),
    update: jest.fn(),
    patch: jest.fn(),
    setEntityEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    setModelEntitiesEmbeddingStatus: jest.fn().mockResolvedValue(undefined),
    createManyLocalized: jest.fn().mockResolvedValue([]),
  };
  OccupationRepositorySpy.mockReturnValue(mockOccupationRepository);
}

describe("BaseOccupationsDoc2csvTransform", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("test transformOccupationSpecToCSVRow()", () => {
    test.each([[ObjectTypes.ESCOOccupation], [ObjectTypes.LocalOccupation]])(
      "should transform a %s Occupation to a CSV row",
      (givenOccupationType) => {
        // GIVEN a valid Occupation
        const givenOccupation = getMockOccupations(
          givenOccupationType as ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation
        )[1];
        // WHEN the Occupation is transformed for a model in English and French
        const actualRow = BaseOccupationsToCSVTransformModule.transformOccupationSpecToCSVRow(givenOccupation, [
          ENGLISH,
          FRENCH,
        ]);
        // THEN the CSV row should be correct
        expect(actualRow).toMatchSnapshot();
      }
    );

    test("should export a column per language, and a missing translation as an empty string", () => {
      // GIVEN an Occupation that is translated in English only
      const givenOccupation = getMockOccupations(ObjectTypes.ESCOOccupation)[0];

      // WHEN the Occupation is transformed for a model in English and French
      const actualRow = BaseOccupationsToCSVTransformModule.transformOccupationSpecToCSVRow(givenOccupation, [
        ENGLISH,
        FRENCH,
      ]);

      // THEN expect every translatable field to have an English column with its value
      expect(actualRow).toMatchObject({
        PREFERREDLABEL_EN: givenOccupation.preferredLabel.get("en"),
        DESCRIPTION_EN: givenOccupation.description.get("en"),
        DEFINITION_EN: givenOccupation.definition.get("en"),
        SCOPENOTE_EN: givenOccupation.scopeNote.get("en"),
        REGULATEDPROFESSIONNOTE_EN: givenOccupation.regulatedProfessionNote.get("en"),
        ALTLABELS_EN: "",
      });
      // AND a French column that is an empty string, not undefined or null
      expect(actualRow).toMatchObject({
        PREFERREDLABEL_FR: "",
        DESCRIPTION_FR: "",
        DEFINITION_FR: "",
        SCOPENOTE_FR: "",
        REGULATEDPROFESSIONNOTE_FR: "",
        ALTLABELS_FR: "",
      });
      // AND no column that is not suffixed with a language
      expect(actualRow).not.toHaveProperty("PREFERREDLABEL");
    });

    test("should keep the n-th altLabel of every language aligned, a missing translation being an empty line", () => {
      // GIVEN an Occupation whose second altLabel is not translated in French
      const givenOccupation = getMockOccupations(ObjectTypes.ESCOOccupation)[1];

      // WHEN the Occupation is transformed for a model in English and French
      const actualRow = BaseOccupationsToCSVTransformModule.transformOccupationSpecToCSVRow(givenOccupation, [
        ENGLISH,
        FRENCH,
      ]);

      // THEN expect both altLabels columns to have the same number of lines
      expect(actualRow.ALTLABELS_EN.split("\n")).toEqual(givenOccupation.altLabels.map((label) => label.get("en")));
      // AND the missing French translation to keep its slot as an empty line
      expect(actualRow.ALTLABELS_FR.split("\n")).toEqual([givenOccupation.altLabels[0].get("fr"), ""]);
    });

    test("should throw an error when the occupationType is unknown", async () => {
      // GIVEN an otherwise valid Occupation
      const givenOccupation = getMockOccupations(ObjectTypes.ESCOOccupation)[0];
      // AND the occupationType is unknown
      givenOccupation.occupationType = "invalid" as ObjectTypes.ESCOOccupation;
      // WHEN the Occupation is transformed
      // THEN expect the given error to be thrown
      expect(() => {
        BaseOccupationsToCSVTransformModule.transformOccupationSpecToCSVRow(givenOccupation, [ENGLISH]);
      }).toThrowError(`Failed to transform Occupation to CSV row: Invalid occupationType: invalid`);
    });
  });
  describe.each([[ObjectTypes.ESCOOccupation], [ObjectTypes.LocalOccupation]])(
    "Test %s occupation type",
    (givenOccupationType) => {
      test.each([
        ["a single language", [ENGLISH]],
        ["multiple languages", [ENGLISH, FRENCH]],
      ])(
        `should correctly transform occupation data to CSV for a model with %s`,
        async (_description, givenLanguages) => {
          // GIVEN findAllWithTranslations returns a stream of occupations
          const givenOccupations = getMockOccupations(
            givenOccupationType as ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation
          );
          setupOccupationRepositoryMock(() => Readable.from(givenOccupations));

          // WHEN the transformation is applied
          const transformedStream = OccupationsToCSVTransform("foo", givenLanguages);

          // THEN the output should be a stream
          const chunks = [];
          for await (const chunk of transformedStream) {
            chunks.push(chunk);
          }
          const actualCSVOutput = chunks.join("");

          // AND the occupations of the given model to have been read with their translations
          expect(getRepositoryRegistry().occupation.findAllWithTranslations).toHaveBeenCalledWith("foo");

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
        // GIVEN findAllWithTranslations returns a stream of occupations
        setupOccupationRepositoryMock(() =>
          Readable.from(
            getMockOccupations(givenOccupationType as ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation)
          )
        );

        // WHEN the transformation is applied for a model in English and French
        const transformedStream = OccupationsToCSVTransform("foo", [ENGLISH, FRENCH]);
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
          "OCCUPATIONGROUPCODE",
          "CODE",
          "DEFINITION_EN",
          "DEFINITION_FR",
          "SCOPENOTE_EN",
          "SCOPENOTE_FR",
          "REGULATEDPROFESSIONNOTE_EN",
          "REGULATEDPROFESSIONNOTE_FR",
          "OCCUPATIONTYPE",
          "ISLOCALIZED",
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
          // GIVEN that the source occupation stream will emit an error
          const givenError = new Error("Test Error");
          setupOccupationRepositoryMock(
            () =>
              new Readable({
                read() {
                  this.emit("error", givenError);
                },
              })
          );

          // WHEN the transformation stream is consumed
          const transformedStream = OccupationsToCSVTransform("foo", [ENGLISH]);
          // THEN expect the given error to be thrown
          await expect(async () => {
            //  iterate to consume the stream
            for await (const _ of transformedStream) {
              // do nothing
            }
          }).rejects.toThrow(givenError);

          // THEN the error should be logged
          const expectedErrorMessage = `Transforming Occupations to CSV failed`;
          expect(console.error).toHaveBeenCalledWith(
            expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
          );

          // AND the stream should end
          expect(transformedStream.closed).toBe(true);
        });

        test("should log an error and end the stream when the transformOccupationSpecToCSVRow throws", async () => {
          // GIVEN findAll returns a stream of occupations
          setupOccupationRepositoryMock(() =>
            Readable.from(
              getMockOccupations(givenOccupationType as ObjectTypes.ESCOOccupation | ObjectTypes.LocalOccupation)
            )
          );

          // AND  the transformOccupationSpecToCSVRow will throw an error
          const givenError = new Error("Mocked Transformation Error");
          const transformFunctionSpy = jest
            .spyOn(BaseOccupationsToCSVTransformModule, "transformOccupationSpecToCSVRow")
            .mockImplementationOnce(() => {
              throw givenError;
            });

          // WHEN the transformation stream is consumed
          const transformedStream = OccupationsToCSVTransform("foo", [ENGLISH]);
          // THEN expect the given error to be thrown

          await expect(async () => {
            //  iterate to consume the stream
            for await (const _ of transformedStream) {
              // do nothing
            }
          }).rejects.toThrowError(`Failed to transform Occupation to CSV row`);

          // THEN the error should be logged
          const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], translatedValueReplacer, 2);
          const expectedErrorMessage = `Failed to transform Occupation to CSV row: ${expectedLoggedItem}`;

          expect(console.error).toHaveBeenCalledWith(
            expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
          );
          // AND the stream should end
          expect(transformedStream.closed).toBe(true);
        });
      });
    }
  );
});
