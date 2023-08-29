import { faker } from '@faker-js/faker';

import * as ModelInfo from "api-specifications/modelInfo";
import {v4 as uuidv4} from "uuid";

import {getMockId} from "src/_test_utilities/mockMongoId";
import {getRandomString, getTestString} from "src/_test_utilities/specialCharacters";

export function getMockModelInfoPayload(number: number): ModelInfo.Types.GET.Response.Payload {
  return Array.from({length: number}, (_, i) => {
    return {
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
    }
  });
}

export function getFakeModelInfoPayload(number: number): ModelInfo.Types.GET.Response.Payload {
  return Array.from({length: number}, (_, i) => {
    return {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: faker.lorem.text().substring(0, ModelInfo.Constants.NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: faker.location.country(),
        shortCode: faker.lorem.text().substring(0,  ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
      },
      description: faker.lorem.text().substring(0, ModelInfo.Constants.DESCRIPTION_MAX_LENGTH),
      released: false,
      releaseNotes: faker.lorem.text().substring(0, ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH),
      version: faker.lorem.text().substring(0, ModelInfo.Constants.VERSION_MAX_LENGTH),
      // @ts-ignore
      createdAt: faker.date.anytime().toISOString(),
      // @ts-ignore
      updatedAt: faker.date.anytime().toISOString(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url()
    }
  });
}