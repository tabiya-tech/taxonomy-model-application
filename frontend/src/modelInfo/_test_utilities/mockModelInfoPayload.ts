import {faker} from '@faker-js/faker';

import * as ModelInfo from "api-specifications/modelInfo"
import {v4 as uuidv4} from "uuid";

import {getMockId} from "src/_test_utilities/mockMongoId";
import {getRandomLorem, getRandomString, getTestString} from "src/_test_utilities/specialCharacters";

export namespace POST {
  /**
   * Get a mock ModelInfo payload with special character strings of maximum length
   */
  export function getPayloadWithOneRandomModelInfo(): ModelInfo.Types.POST.Response.Payload {
    return getRandomModelInfo(1);
  }
}

export namespace GET {

  /**
   * Get a mock ModelInfo payload with special character strings of maximum length
   * @param number The number of ModelInfo objects to generate
   */
  export function getPayloadWithArrayOfRandomModelInfo(number: number): ModelInfo.Types.GET.Response.Payload {
    return Array.from({length: number}, (_, i) => {
      return getRandomModelInfo(i);
    });
  }

  /**
   * Get a mock ModelInfo payload with lorem ipsum strings of maximum length
   * @param number
   */
  export function getPayloadWithArrayOfFakeModelInfo(number: number): ModelInfo.Types.GET.Response.Payload {
    return Array.from({length: number}, (_, i) => {
      return {
        id: getMockId(i),
        UUID: uuidv4(),
        previousUUID: uuidv4(),
        originUUID: uuidv4(),
        name: getRandomLorem(ModelInfo.Constants.NAME_MAX_LENGTH),
        locale: {
          UUID: uuidv4(),
          name: getRandomLorem(ModelInfo.Constants.NAME_MAX_LENGTH),
          shortCode: getRandomLorem(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
        },
        description: getRandomLorem(ModelInfo.Constants.DESCRIPTION_MAX_LENGTH),
        released: i % 2 === 0, // 50% chance of released
        releaseNotes: getRandomLorem(ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH),
        version: getRandomLorem(ModelInfo.Constants.VERSION_MAX_LENGTH),
        createdAt: faker.date.anytime().toISOString(),
        updatedAt: faker.date.anytime().toISOString(),
        path: faker.internet.url(),
        tabiyaPath: faker.internet.url()
      }
    });
  }
}

function getRandomModelInfo(_id: number) {
  return {
    id: getMockId(_id),
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
    released: _id % 2 === 0,
    releaseNotes: getTestString(ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH),
    version: getTestString(ModelInfo.Constants.VERSION_MAX_LENGTH),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    path: "https://foo/bar",
    tabiyaPath: "https://foo/bar/baz"
  };
}