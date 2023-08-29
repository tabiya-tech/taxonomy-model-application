import * as ModelInfo from "api-specifications/modelInfo";
import {v4 as uuidv4} from "uuid";

import {ModelDirectoryTypes} from "src/modeldirectory/modelDirectory.types";
import {getMockId} from "src/_test_utilities/mockMongoId";
import {getRandomLorem, getRandomString, getTestString} from "src/_test_utilities/specialCharacters";
import {faker} from "@faker-js/faker";
import {CELL_MAX_LENGTH} from "../ModelsTable";

export function getArrayOfFakeModels(number: number): ModelDirectoryTypes.ModelInfo[] {
  const models: ModelDirectoryTypes.ModelInfo[] = [];
  for (let i = 0; i < number; i++) {
    const model: ModelDirectoryTypes.ModelInfo = {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: Array.from({length: 20}, (_, i) => faker.lorem.word()).join(" ").substr(0, NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: faker.location.country().substr(0, NAME_MAX_LENGTH),
        shortCode: faker.location.countryCode("alpha-3").substr(0, LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: i % 2 === 0 ? getRandomLorem(DESCRIPTION_MAX_LENGTH) : getRandomLorem(CELL_MAX_LENGTH / 2), // 50% chance of long description
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: faker.lorem.text().substr(0, RELEASE_NOTES_MAX_LENGTH),
      version: faker.system.semver().substr(0, VERSION_MAX_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url()
    };
    models.push(model);
  }
  return models
}

export function getArrayOfFakeModelsMaxLength(number: number): ModelDirectoryTypes.ModelInfo[] {
  const models: ModelDirectoryTypes.ModelInfo[] = [];
  for (let i = 0; i < number; i++) {
    const model: ModelDirectoryTypes.ModelInfo = {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: getRandomLorem(NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: getRandomLorem(NAME_MAX_LENGTH),
        shortCode: getRandomLorem(LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getRandomLorem(DESCRIPTION_MAX_LENGTH),
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: getRandomLorem(RELEASE_NOTES_MAX_LENGTH),
      version: getRandomLorem(VERSION_MAX_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url()
    };
    models.push(model);
  }
  return models
}

export function getOneRandomModelMaxLength(): ModelDirectoryTypes.ModelInfo {
  return getArrayOfRandomModelsMaxLength(1)[0];
}

export function getArrayOfRandomModelsMaxLength(number: number): ModelDirectoryTypes.ModelInfo[] {
  const models: ModelDirectoryTypes.ModelInfo[] = [];
  for (let i = 0; i < number; i++) {
    const model: ModelDirectoryTypes.ModelInfo = {
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
      released: false,
      releaseNotes: getTestString(ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(ModelInfo.Constants.VERSION_MAX_LENGTH),
      // @ts-ignore
      createdAt: new Date().toISOString(),
      // @ts-ignore
      updatedAt: new Date().toISOString(),
      path: "https://foo/bar",
      tabiyaPath: "https://foo/bar/baz"
      description: getTestString(DESCRIPTION_MAX_LENGTH),
      released: i % 2 === 0,
      releaseNotes: getTestString(RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(VERSION_MAX_LENGTH),
      createdAt: new Date(),
      updatedAt: new Date(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url()
    };
    models.push(model);
  }
  return models
}