import {faker} from '@faker-js/faker';

import {
  ModelInfo,
  DESCRIPTION_MAX_LENGTH,
  LOCALE_SHORTCODE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH, VERSION_MAX_LENGTH
} from "api-specifications/modelInfo";
import {v4 as uuidv4} from "uuid";

import {getMockId} from "src/_test_utilities/mockMongoId";
import {getRandomLorem, getRandomString, getTestString} from "src/_test_utilities/specialCharacters";

/**
 * Get a mock ModelInfo payload with special character strings of maximum length
 * @param number The number of ModelInfo objects to generate
 */
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
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: getTestString(RELEASE_NOTES_MAX_LENGTH),
      version: getTestString(VERSION_MAX_LENGTH),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      path: "https://foo/bar",
      tabiyaPath: "https://foo/bar/baz"
    }
  });
}

/**
 * Get a mock ModelInfo payload with lorem ipsum strings of maximum length
 * @param number
 */
export function getFakeModelInfoPayload(number: number): ModelInfo.GET.Response.Payload {
  return Array.from({length: number}, (_, i) => {
    return {
      id: getMockId(i),
      UUID: uuidv4(),
      previousUUID: uuidv4(),
      originUUID: uuidv4(),
      name: getRandomLorem(NAME_MAX_LENGTH),
      locale: {
        UUID: uuidv4(),
        name: getRandomLorem(NAME_MAX_LENGTH),
        shortCode: getRandomLorem(LOCALE_SHORTCODE_MAX_LENGTH),
      },
      description: getRandomLorem(DESCRIPTION_MAX_LENGTH),
      released: i % 2 === 0, // 50% chance of released
      releaseNotes: getRandomLorem(RELEASE_NOTES_MAX_LENGTH),
      version: getRandomLorem(VERSION_MAX_LENGTH),
      createdAt: faker.date.anytime().toISOString(),
      updatedAt: faker.date.anytime().toISOString(),
      path: faker.internet.url(),
      tabiyaPath: faker.internet.url()
    }
  });
}