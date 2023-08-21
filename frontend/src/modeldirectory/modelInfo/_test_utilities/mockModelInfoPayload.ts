import { faker } from '@faker-js/faker';

import {
  ModelInfo,
  DESCRIPTION_MAX_LENGTH,
  LOCALE_SHORTCODE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH, VERSION_MAX_LENGTH
} from "api-specifications/modelInfo";
import {v4 as uuidv4} from "uuid";

import {getMockId} from "src/_test_utilities/mockMongoId";
import {getRandomString, getTestString} from "src/_test_utilities/specialCharacters";

export function getMockModelInfoPayload(number: number): ModelInfo.GET.Response.Payload {
  return Array.from({length: number}, (_, i) => {
    return {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: getRandomString(NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: getRandomString(NAME_MAX_LENGTH),
        shortCode: getTestString(LOCALE_SHORTCODE_MAX_LENGTH)
      },
      description: getTestString(DESCRIPTION_MAX_LENGTH),
      released: false,
      releaseNotes: getTestString(RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(VERSION_MAX_LENGTH),
      // @ts-ignore
      createdAt: new Date().toISOString(),
      // @ts-ignore
      updatedAt: new Date().toISOString(),
      path: "https://foo/bar",
      tabiyaPath: "https://foo/bar/baz"
    }
  });
}

export function getFakeModelInfoPayload(number: number): ModelInfo.GET.Response.Payload {
  return Array.from({length: number}, (_, i) => {
    return {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: faker.lorem.text().substr(0, NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: faker.location.country(),
        shortCode: faker.lorem.text().substr(0,  LOCALE_SHORTCODE_MAX_LENGTH),
      },
      description: faker.lorem.text().substr(0, DESCRIPTION_MAX_LENGTH),
      released: false,
      releaseNotes: faker.lorem.text().substr(0, RELEASE_NOTES_MAX_LENGTH),
      version: faker.lorem.text().substr(0, VERSION_MAX_LENGTH),
      // @ts-ignore
      createdAt: faker.date.anytime().toISOString(),
      // @ts-ignore
      updatedAt: faker.date.anytime().toISOString(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url()
    }
  });
}