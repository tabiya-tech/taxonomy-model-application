import { faker } from "@faker-js/faker";

import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";

import { v4 as uuidv4 } from "uuid";

import { getMockId } from "src/_test_utilities/mockMongoId";
import { getRandomLorem, getRandomString, getTestString } from "src/_test_utilities/specialCharacters";
import {
  EMBEDDING_PROCESS_STATUS,
  EMBEDDING_SERVICE_IDS,
  EXPORT_PROCESS_STATUS,
  IMPORT_PROCESS_STATUS,
  ModelInfoResponseSchema,
} from "src/api-types";

export namespace POST {
  /**
   * Get a mock ModelInfo payload with special character strings of maximum length
   */
  export function getPayloadWithOneRandomModelInfo(): ModelInfoResponseSchema {
    return getRandomModelInfo(1);
  }
}

export namespace PATCH {
  /**
   * Get a mock ModelInfo payload with special character strings of maximum length
   */
  export function getPayloadWithOneRandomModelInfo(): ModelInfoResponseSchema {
    return { ...getRandomModelInfo(1), released: true };
  }
}

export namespace GET {
  /**
   * Get a mock ModelInfo payload with special character strings of maximum length
   * @param number The number of ModelInfo objects to generate
   */
  export function getPayloadWithArrayOfRandomModelInfo(number: number): ModelInfoResponseSchema[] {
    return Array.from({ length: number }, (_, i) => {
      return getRandomModelInfo(i);
    });
  }

  /**
   * Get a mock ModelInfo payload with lorem ipsum strings of maximum length
   * @param count
   */
  export function getPayloadWithArrayOfFakeModelInfo(count: number): ModelInfoResponseSchema[] {
    const allImportStatuses = Object.values(IMPORT_PROCESS_STATUS).reverse();

    const allExportStatuses = Object.values(EXPORT_PROCESS_STATUS).reverse();

    const allEmbeddingStatuses = Object.values(EMBEDDING_PROCESS_STATUS).reverse();

    return Array.from({ length: count }, (_, i) => {
      const randomizedImportStatus = allImportStatuses[i % allImportStatuses.length];
      const randomizedExportStatus = allExportStatuses[i % allExportStatuses.length];
      const randomizedEmbeddingStatus = allEmbeddingStatuses[i % allEmbeddingStatuses.length];
      return {
        id: getMockId(i),
        UUID: uuidv4(),
        modelHistory: [
          {
            id: getMockId(1000 + i),
            UUID: uuidv4(),
            name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
            version: getRandomString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
            localeShortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
          },
        ],
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
        license: getRandomString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
        path: faker.internet.url(),
        tabiyaPath: faker.internet.url(),
        exportProcessState: [
          {
            id: getMockId(10000 + i),
            status: randomizedExportStatus as ModelInfoResponseSchema["exportProcessState"][number]["status"],
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
          status: randomizedImportStatus as ModelInfoResponseSchema["importProcessState"]["status"],
          result: {
            errored: false,
            parsingErrors: faker.datatype.boolean(),
            parsingWarnings: faker.datatype.boolean(),
          },
          createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
          updatedAt: new Date().toISOString(),
        },
        embeddingProcessState: [
          {
            id: getMockId(20000 + i),
            status: randomizedEmbeddingStatus as ModelInfoResponseSchema["embeddingProcessState"][number]["status"],
            embeddingServiceId: EMBEDDING_SERVICE_IDS[i % EMBEDDING_SERVICE_IDS.length],
            totalDocuments: faker.number.int({ min: 0, max: 1000 }),
            errorCounts: faker.number.int({ min: 0, max: 10 }),
            warningCounts: faker.number.int({ min: 0, max: 10 }),
            completedDocuments: faker.number.int({ min: 0, max: 1000 }),
            createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
            updatedAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
  }
}

export function getRandomModelInfo(_id: number): ModelInfoResponseSchema {
  const allImportStatuses = Object.values(IMPORT_PROCESS_STATUS);
  const randomizedImportStatus = allImportStatuses[_id % allImportStatuses.length];
  const allExportStatuses = Object.values(EXPORT_PROCESS_STATUS);
  const randomizeExportStatus = allExportStatuses[_id % allExportStatuses.length];
  const allEmbeddingStatuses = Object.values(EMBEDDING_PROCESS_STATUS);
  const randomizedEmbeddingStatus = allEmbeddingStatuses[_id % allEmbeddingStatuses.length];

  return {
    id: getMockId(_id),
    UUID: uuidv4(),
    modelHistory: [
      {
        id: getMockId(1000 + _id),
        UUID: uuidv4(),
        name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
        version: getRandomString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
        localeShortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      },
    ],
    name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: uuidv4(),
      name: getRandomString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    released: _id % 2 === 0,
    releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    path: "https://foo/bar",
    tabiyaPath: "https://foo/bar/baz",
    exportProcessState: [
      {
        id: getMockId(10000 + _id),
        status: randomizeExportStatus as ModelInfoResponseSchema["exportProcessState"][number]["status"],
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
      status: randomizedImportStatus as ModelInfoResponseSchema["importProcessState"]["status"],
      result: {
        errored: _id % 2 === 0,
        parsingErrors: faker.datatype.boolean(),
        parsingWarnings: faker.datatype.boolean(),
      },
      createdAt: _id % 2 === 0 ? new Date(new Date().getTime() - 60000).toISOString() : undefined, // make createdAt 1 minute ago and different from updatedAt
      updatedAt: _id % 2 === 0 ? new Date().toISOString() : undefined,
    },
    embeddingProcessState: [
      {
        id: getMockId(20000 + _id),
        status: randomizedEmbeddingStatus as ModelInfoResponseSchema["embeddingProcessState"][number]["status"],
        embeddingServiceId: EMBEDDING_SERVICE_IDS[_id % EMBEDDING_SERVICE_IDS.length],
        totalDocuments: faker.number.int({ min: 0, max: 1000 }),
        errorCounts: faker.number.int({ min: 0, max: 10 }),
        warningCounts: faker.number.int({ min: 0, max: 10 }),
        completedDocuments: faker.number.int({ min: 0, max: 1000 }),
        createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
        updatedAt: new Date().toISOString(),
      },
    ],
    createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
    updatedAt: new Date().toISOString(),
  };
}
