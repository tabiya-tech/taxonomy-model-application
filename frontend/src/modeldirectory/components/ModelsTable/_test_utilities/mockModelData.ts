import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import { ImportProcessStateEnums } from "api-specifications/importProcessState/enums";

import { v4 as uuidv4 } from "uuid";

import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { getMockId } from "src/_test_utilities/mockMongoId";
import { getRandomLorem, getRandomString, getTestString } from "src/_test_utilities/specialCharacters";
import { faker } from "@faker-js/faker";
import { CELL_MAX_LENGTH } from "../ModelsTable";

export function getOneFakeModel(id?: number): ModelInfoTypes.ModelInfo {
  const model = getArrayOfFakeModels(1)[0];
  model.id = getMockId(id ?? 1);
  return model;
}

export function getArrayOfFakeModels(count: number): ModelInfoTypes.ModelInfo[] {
  const models: ModelInfoTypes.ModelInfo[] = [];
  for (let i = 0; i < count; i++) {
    const model: ModelInfoTypes.ModelInfo = {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: `${i + 1}/${count} - ${getRandomLorem(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH)}`.substring(
        0,
        ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH
      ),
      locale: {
        UUID: uuidv4(),
        name: faker.location.country().substring(0, ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: faker.location
          .countryCode("alpha-3")
          .substring(0, LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      },
      description:
        i % 2 === 0
          ? getRandomLorem(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH)
          : getRandomLorem(CELL_MAX_LENGTH / 2), // 50% chance of long description
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: faker.lorem.text().substring(0, ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: faker.system.semver().substring(0, ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
      createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url(),
      exportProcessState: [getOneFakeExportProcessState(i)],
      importProcessState: {
        id: getMockId(10000 + i),
        status: getRandomImportStatus(i),
        result: {
          errored: i % 2 === 0,
          parsingErrors: i % 2 === 0,
          parsingWarnings: i % 2 === 0,
        },
      },
    };
    models.push(model);
  }
  return models;
}

export function getArrayOfFakeModelsMaxLength(count: number): ModelInfoTypes.ModelInfo[] {
  const models: ModelInfoTypes.ModelInfo[] = [];
  for (let i = 0; i < count; i++) {
    const model: ModelInfoTypes.ModelInfo = {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: `${i + 1}/${count} - ${getRandomLorem(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH)}`.substring(
        0,
        ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH
      ),
      locale: {
        UUID: uuidv4(),
        name: getRandomLorem(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: getRandomLorem(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      },
      description: getRandomLorem(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: getRandomLorem(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: getRandomLorem(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
      createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url(),
      exportProcessState: [getOneFakeExportProcessState(i)],
      importProcessState: {
        id: getMockId(10000 + i),
        status: getRandomImportStatus(i),
        result: {
          errored: i % 2 === 0,
          parsingErrors: i % 2 === 0,
          parsingWarnings: i % 2 === 0,
        },
      },
    };
    models.push(model);
  }
  return models;
}

export function getOneRandomModelMaxLength(): ModelInfoTypes.ModelInfo {
  return getArrayOfRandomModelsMaxLength(1)[0];
}

export function getArrayOfRandomModelsMaxLength(number: number): ModelInfoTypes.ModelInfo[] {
  const models: ModelInfoTypes.ModelInfo[] = [];
  for (let i = 0; i < number; i++) {
    const model: ModelInfoTypes.ModelInfo = {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: getRandomString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      },
      description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      released: i % 2 === 0,
      releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
      createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url(),
      exportProcessState: [getOneFakeExportProcessState(i)],
      importProcessState: {
        id: getMockId(10000 + i),
        status: getRandomImportStatus(i),
        result: {
          errored: i % 2 === 0,
          parsingErrors: i % 2 === 0,
          parsingWarnings: i % 2 === 0,
        },
      },
    };
    models.push(model);
  }
  return models;
}

export const fakeModel: ModelInfoTypes.ModelInfo = {
  UUID: "8d914eab-6f7d-4183-accc-a09f99887b39",
  createdAt: new Date("2023-10-18T17:35:10.571Z"),
  description: "aw j zt   agrkasl dy ogtimpsauwumu l utrovthao syertm beawpxluhyudgzbbm",
  id: "000000000000000000000001",
  importProcessState: {
    id: "000000000000000000000001",
    result: {
      errored: true,
      parsingErrors: true,
      parsingWarnings: true,
    },
    status: ImportProcessStateEnums.Status.PENDING,
  },
  exportProcessState: [
    {
      downloadUrl: "https://www.example.com/",
      id: "000000000000000000000001",
      result: {
        errored: true,
        exportErrors: true,
        exportWarnings: true,
      },
      status: ExportProcessStateAPISpecs.Enums.Status.PENDING,
      timestamp: new Date("2023-10-18T17:35:10.571Z"),
    },
  ],
  locale: {
    UUID: "7c4ea00b-fbea-4a31-9c04-009c813f5f34",
    name: "Palestine",
    shortCode: "ETH",
  },
  name: "1/1 - fysmros tcgcnjbbrrev",
  originUUID: "fed55cd7-2a8b-4e24-8ee6-4e1aa8f8b0ab",
  path: "https://unwelcome-editorial.net/",
  previousUUID: "b7095a47-f5dd-4142-a7d7-a7eb3e207d3a",
  releaseNotes: "Perferendis modi impedit necessitatibus a",
  released: true,
  tabiyaPath: "https://silver-vulture.biz",
  updatedAt: new Date("2023-10-18T17:35:10.571Z"),
  version: "0.2.2",
};

export function getRandomImportStatus(id: number) {
  const allStatuses = Object.values(ImportProcessStateAPISpecs.Enums.Status); // Assuming it's an enum with string values
  return allStatuses[id % allStatuses.length];
}

export function getRandomExportStatus(id: number) {
  const allStatuses = Object.values(ExportProcessStateAPISpecs.Enums.Status); // Assuming it's an enum with string values
  return allStatuses[id % allStatuses.length];
}

export function getOneFakeExportProcessState(i: number): ModelInfoTypes.ExportProcessState {
  return {
    id: getMockId(10000 + i),
    status: getRandomExportStatus(i),
    result: {
      errored: i % 2 === 0,
      exportErrors: i % 2 === 0,
      exportWarnings: i % 2 === 0,
    },
    downloadUrl: faker.internet.url(),
    timestamp: new Date(Date.now() - i * 1000 * 60 * 60 * 24),
  };
}
