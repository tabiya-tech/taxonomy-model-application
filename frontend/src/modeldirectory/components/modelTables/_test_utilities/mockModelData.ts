import * as ModelInfo from "api-specifications/modelInfo";
import {v4 as uuidv4} from "uuid";

import {ModelInfoTypes} from "src/modelInfo/modelInfoTypes";
import {getMockId} from "src/_test_utilities/mockMongoId";
import {getRandomLorem, getRandomString, getTestString} from "src/_test_utilities/specialCharacters";
import {faker} from "@faker-js/faker";
import {CELL_MAX_LENGTH} from "../ModelsTable";

export function getArrayOfFakeModels(number: number): ModelInfoTypes.ModelInfo[] {
  const models: ModelInfoTypes.ModelInfo[] = [];
  for (let i = 0; i < number; i++) {
    const model: ModelInfoTypes.ModelInfo = {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: Array.from({length: 20}, (_, i) => faker.lorem.word()).join(" ").substring(0, ModelInfo.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: faker.location.country().substring(0, ModelInfo.Constants.NAME_MAX_LENGTH),
        shortCode: faker.location.countryCode("alpha-3").substring(0, ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: i % 2 === 0 ? getRandomLorem(ModelInfo.Constants.DESCRIPTION_MAX_LENGTH) : getRandomLorem(CELL_MAX_LENGTH / 2), // 50% chance of long description
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: faker.lorem.text().substring(0, ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: faker.system.semver().substring(0, ModelInfo.Constants.VERSION_MAX_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url()
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
      name: getRandomLorem(ModelInfo.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: getRandomLorem(ModelInfo.Constants.NAME_MAX_LENGTH),
        shortCode: getRandomLorem(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getRandomLorem(ModelInfo.Constants.DESCRIPTION_MAX_LENGTH),
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: getRandomLorem(ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: getRandomLorem(ModelInfo.Constants.VERSION_MAX_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url()
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
      name: getRandomString(ModelInfo.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: getRandomString(ModelInfo.Constants.NAME_MAX_LENGTH),
        shortCode: getTestString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getTestString(ModelInfo.Constants.DESCRIPTION_MAX_LENGTH),
      released: i % 2 === 0,
      releaseNotes: getTestString(ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(ModelInfo.Constants.VERSION_MAX_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url()
    };
    models.push(model);
  }
  return models
}