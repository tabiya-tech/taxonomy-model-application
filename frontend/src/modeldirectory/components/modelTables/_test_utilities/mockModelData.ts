import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import {v4 as uuidv4} from "uuid";

import {ModelInfoTypes} from "src/modelInfo/modelInfoTypes";
import {getMockId} from "src/_test_utilities/mockMongoId";
import {getRandomLorem, getRandomString, getTestString} from "src/_test_utilities/specialCharacters";
import {faker} from "@faker-js/faker";
import {CELL_MAX_LENGTH} from "../ModelsTable";

export function getOneFakeModel(id?: number): ModelInfoTypes.ModelInfo {
  return getArrayOfFakeModels(id ? id : 1)[0];
}

export function getArrayOfFakeModels(number: number): ModelInfoTypes.ModelInfo[] {
  const models: ModelInfoTypes.ModelInfo[] = [];
  for (let i = 0; i < number; i++) {
    const model: ModelInfoTypes.ModelInfo = {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: Array.from({length: 20}, (_, i) => faker.lorem.word()).join(" ").substring(0, ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: faker.location.country().substring(0, ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: faker.location.countryCode("alpha-3").substring(0, LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: i % 2 === 0 ? getRandomLorem(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) : getRandomLorem(CELL_MAX_LENGTH / 2), // 50% chance of long description
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: faker.lorem.text().substring(0, ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: faker.system.semver().substring(0, ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url(),
      importProcessState: {
        id: getMockId(10000 + i),
        status: getRandomStatus(i),
        result: {
          errored: i % 2 === 0,
          parsingErrors: i % 2 === 0,
          parsingWarnings: i % 2 === 0,
        }
      }
    };
    models.push(model);
  }
  return models
}

export function getArrayOfFakeModelsMaxLength(number: number): ModelInfoTypes.ModelInfo[] {
  const models: ModelInfoTypes.ModelInfo[] = [];
  for (let i = 0; i < number; i++) {
    const model: ModelInfoTypes.ModelInfo = {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: getRandomLorem(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: getRandomLorem(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
        shortCode: getRandomLorem(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getRandomLorem(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: getRandomLorem(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: getRandomLorem(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url(),
      importProcessState: {
        id: getMockId(10000 + i),
        status: getRandomStatus(i),
        result: {
          errored: i % 2 === 0,
          parsingErrors: i % 2 === 0,
          parsingWarnings: i % 2 === 0,
        }
      }
    };
    models.push(model);
  }
  return models
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
        shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      released: i % 2 === 0,
      releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url(),
      importProcessState: {
        id: getMockId(10000 + i),
        status: getRandomStatus(i),
        result: {
          errored: i % 2 === 0,
          parsingErrors: i % 2 === 0,
          parsingWarnings: i % 2 === 0,
        }
      }
    };
    models.push(model);
  }
  return models
}

export function getArrayOfFakeModelsForSorting(): ModelInfoTypes.ModelInfo[] {
  const baseModel: Omit<ModelInfoTypes.ModelInfo, 'name' | 'version' | 'createdAt' | 'updatedAt'> = {
    id: 'base',
    UUID: uuidv4(),
    previousUUID: uuidv4(),
    originUUID: uuidv4(),
    locale: {
      UUID: uuidv4(),
      name: faker.location.country().substring(0, ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: faker.location.countryCode("alpha-3").substring(0, LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
    },
    description: getRandomLorem(CELL_MAX_LENGTH / 2),
    released: true,
    releaseNotes: faker.lorem.text().substring(0, ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
    path: faker.internet.url(),
    tabiyaPath: faker.internet.url(),
    importProcessState: {
      id: getMockId(10000),
      status: getRandomStatus(1),
      result: {
        errored: true,
        parsingErrors: true,
        parsingWarnings: true,
      }
    }
  };

  return [
    {
      ...baseModel,
      id: '1',
      name: 'ancient',
      version: '1.0.0',
      createdAt: new Date('2022-01-01T00:00:00.000Z'),
      updatedAt: new Date('2022-01-01T00:00:00.000Z'),
    },
    {
      ...baseModel,
      id: '2',
      name: 'older',
      version: '1.1.0',
      createdAt: new Date('2022-01-02T00:00:00.000Z'),
      updatedAt: new Date('2022-01-02T00:00:00.000Z'),
    },
    {
      ...baseModel,
      id: '3',
      name: 'old',
      version: '1.1.1',
      createdAt: new Date('2022-01-03T00:00:00.000Z'),
      updatedAt: new Date('2022-01-03T00:00:00.000Z'),
    },
    {
      ...baseModel,
      id: '4',
      name: 'new',
      version: '1.1.2',
      createdAt: new Date('2022-01-04T00:00:00.000Z'),
      updatedAt: new Date('2022-01-04T00:00:00.000Z'),
    },
    {
      ...baseModel,
      id: '5',
      name: 'newer',
      version: '1.1.3',
      createdAt: new Date('2022-01-05T00:00:00.000Z'),
      updatedAt: new Date('2022-01-05T00:00:00.000Z'),
    },
    {
      ...baseModel,
      id: '6',
      name: 'newest',
      version: '1.2.2',
      createdAt: new Date('2022-01-06T00:00:00.000Z'),
      updatedAt: new Date('2022-01-06T00:00:00.000Z'),
    }
  ];
}


export function getRandomStatus(id: number) {
  const allStatuses = Object.values(ImportProcessStateAPISpecs.Enums.Status); // Assuming it's an enum with string values
  return allStatuses[id % allStatuses.length];
}
