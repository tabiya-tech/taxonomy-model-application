import {faker} from '@faker-js/faker';

import ModelInfoAPISpecs from "api-specifications/modelInfo"
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";

import {v4 as uuidv4} from "uuid";

import {getMockId} from "src/_test_utilities/mockMongoId";
import {getRandomLorem, getRandomString, getTestString} from "src/_test_utilities/specialCharacters";

export namespace POST {
  /**
   * Get a mock ModelInfo payload with special character strings of maximum length
   */
  export function getPayloadWithOneRandomModelInfo(): ModelInfoAPISpecs.POST.Response.Payload {
    return getRandomModelInfo(1);
  }
}

export namespace GET {

  /**
   * Get a mock ModelInfo payload with special character strings of maximum length
   * @param number The number of ModelInfo objects to generate
   */
  export function getPayloadWithArrayOfRandomModelInfo(number: number): ModelInfoAPISpecs.GET.Response.Payload {
    return Array.from({length: number}, (_, i) => {
      return getRandomModelInfo(i);
    });
  }

  /**
   * Get a mock ModelInfo payload with lorem ipsum strings of maximum length
   * @param number
   */
  export function getPayloadWithArrayOfFakeModelInfo(number: number): ModelInfoAPISpecs.GET.Response.Payload {
    const allStatuses = Object.values(ImportProcessStateAPISpecs.Enums.Status); // Assuming it's an enum with string values

    return Array.from({length: number}, (_, i) => {
      const randomizedStatus = allStatuses[i % allStatuses.length];
      return {
        id: getMockId(i),
        UUID: uuidv4(),
        previousUUID: uuidv4(),
        originUUID: uuidv4(),
        name: getRandomLorem(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
        locale: {
          UUID: uuidv4(),
          name: getRandomLorem(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
          shortCode: getRandomLorem(ModelInfoAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
        },
        description: getRandomLorem(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
        released: i % 2 === 0, // 50% chance of released
        releaseNotes: getRandomLorem(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
        version: getRandomLorem(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
        path: faker.internet.url(),
        tabiyaPath: faker.internet.url(),
        importProcessState: {
          id: getMockId(10000 + i),
          status: randomizedStatus,
          result: {
            errored: false,
            parsingErrors: faker.datatype.boolean(),
            parsingWarnings: faker.datatype.boolean(),
          }
        },
        createdAt: faker.date.anytime().toISOString(),
        updatedAt: faker.date.anytime().toISOString(),
      }
    });
  }
}

export function getRandomModelInfo(_id: number) {
  const allStatuses = Object.values(ImportProcessStateAPISpecs.Enums.Status); // Assuming it's an enum with string values
  const randomizedStatus = allStatuses[_id % allStatuses.length];

  return {
    id: getMockId(_id),
    UUID: uuidv4(),
    previousUUID: uuidv4(),
    originUUID: uuidv4(),
    name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: uuidv4(),
      name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(ModelInfoAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    released: _id % 2 === 0,
    releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    path: "https://foo/bar",
    tabiyaPath: "https://foo/bar/baz",
    importProcessState: {
      id: getMockId(10000 + _id),
      status: randomizedStatus,
      result: {
        errored: _id % 2 === 0,
        parsingErrors: faker.datatype.boolean(),
        parsingWarnings: faker.datatype.boolean(),
      }
    },
    createdAt: new Date(new Date().getTime() - 60000).toISOString(), // make createdAt 1 minute ago and different from updatedAt
    updatedAt: new Date().toISOString(),
  };
}
