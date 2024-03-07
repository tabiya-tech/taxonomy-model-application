import { faker } from "@faker-js/faker";

import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";

import { v4 as uuidv4 } from "uuid";

import { getMockId } from "src/_test_utilities/mockMongoId";
import { getRandomLorem, getRandomString, getTestString } from "src/_test_utilities/specialCharacters";

export namespace POST {
  /**
   * Get a mock ModelInfo payload with special character strings of maximum length
   */
  export function getPayloadWithOneRandomModelInfo(): ModelInfoAPISpecs.Types.POST.Response.Payload {
    return getRandomModelInfo(1);
  }
}

export namespace GET {
  /**
   * Get a mock ModelInfo payload with special character strings of maximum length
   * @param number The number of ModelInfo objects to generate
   */
  export function getPayloadWithArrayOfRandomModelInfo(number: number): ModelInfoAPISpecs.Types.GET.Response.Payload {
    return Array.from({ length: number }, (_, i) => {
      return getRandomModelInfo(i);
    });
  }

  /**
   * Get a mock ModelInfo payload with lorem ipsum strings of maximum length
   * @param count
   */
  export function getPayloadWithArrayOfFakeModelInfo(count: number): ModelInfoAPISpecs.Types.GET.Response.Payload {
    const allImportStatuses: ImportProcessStateAPISpecs.Enums.Status[] = Object.values(
      ImportProcessStateAPISpecs.Enums.Status
    ).reverse(); // Assuming it's an enum with string values PENDING, RUNNING, COMPLETED

    const allExportStatuses: ExportProcessStateAPISpecs.Enums.Status[] = Object.values(
      ExportProcessStateAPISpecs.Enums.Status
    ).reverse(); // Assuming it's an enum with string values PENDING, RUNNING, COMPLETED

    return Array.from({ length: count }, (_, i) => {
      const randomizedImportStatus = allImportStatuses[i % allImportStatuses.length];
      const randomizedExportStatus = allExportStatuses[i % allExportStatuses.length];
      return {
        id: getMockId(i),
        UUID: uuidv4(),
        UUIDHistory: [uuidv4()],
        name: `${i + 1}/${count} - ${getRandomLorem(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH)}`.slice(
          0,
          ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH
        ),
        locale: {
          UUID: uuidv4(),
          name: getRandomLorem(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
          shortCode: faker.location.countryCode("alpha-3"),
        },
        description: getRandomLorem(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        released: i % 2 === 0, // 50% chance of released
        releaseNotes: getRandomLorem(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
        version: getRandomLorem(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
        path: faker.internet.url(),
        tabiyaPath: faker.internet.url(),
        exportProcessState: [
          {
            id: getMockId(10000 + i),
            status: randomizedExportStatus,
            result: {
              errored: false,
              exportErrors: faker.datatype.boolean(),
              exportWarnings: faker.datatype.boolean(),
            },
            downloadUrl: faker.internet.url(),
            timestamp: new Date().toISOString(),
            createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
            updatedAt: new Date().toISOString(),
          },
        ],
        importProcessState: {
          id: getMockId(10000 + i),
          status: randomizedImportStatus,
          result: {
            errored: false,
            parsingErrors: faker.datatype.boolean(),
            parsingWarnings: faker.datatype.boolean(),
          },
          createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
          updatedAt: new Date().toISOString(),
        },
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }
}

/**
 * Extracts the type of the elements of an array.
 */
type PayloadItem<ArrayOfItemType extends Array<unknown>> = ArrayOfItemType extends (infer ItemType)[]
  ? ItemType
  : never;

export function getRandomModelInfo(_id: number): PayloadItem<ModelInfoAPISpecs.Types.GET.Response.Payload> {
  const allImportStatuses = Object.values(ImportProcessStateAPISpecs.Enums.Status); // Assuming it's an enum with string values
  const randomizedImportStatus = allImportStatuses[_id % allImportStatuses.length];
  const allExportStatuses = Object.values(ExportProcessStateAPISpecs.Enums.Status); // Assuming it's an enum with string values
  const randomizeExportStatus = allExportStatuses[_id % allExportStatuses.length];

  return {
    id: getMockId(_id),
    UUID: uuidv4(),
    UUIDHistory: [uuidv4()],
    name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: uuidv4(),
      name: getRandomString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    released: _id % 2 === 0,
    releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    path: "https://foo/bar",
    tabiyaPath: "https://foo/bar/baz",
    exportProcessState: [
      {
        id: getMockId(10000 + _id),
        status: randomizeExportStatus,
        result: {
          errored: _id % 2 === 0,
          exportErrors: faker.datatype.boolean(),
          exportWarnings: faker.datatype.boolean(),
        },
        downloadUrl: _id % 2 === 0 ? "" : "https://foo/bar/baz", // errored models don't have downloadUrl
        timestamp: new Date().toISOString(),
        createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
        updatedAt: new Date().toISOString(),
      },
    ],
    importProcessState: {
      id: getMockId(10000 + _id),
      status: randomizedImportStatus,
      result: {
        errored: _id % 2 === 0,
        parsingErrors: faker.datatype.boolean(),
        parsingWarnings: faker.datatype.boolean(),
      },
      createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
      updatedAt: new Date().toISOString(),
    },
    createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
    updatedAt: new Date().toISOString(),
  };
}
