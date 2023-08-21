import {
  DESCRIPTION_MAX_LENGTH,
  LOCALE_SHORTCODE_MAX_LENGTH,
  NAME_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH, VERSION_MAX_LENGTH
} from "api-specifications/modelInfo";
import {v4 as uuidv4} from "uuid";

import {ModelDirectoryTypes} from "src/modeldirectory/modelDirectory.types";
import {getMockId} from "src/_test_utilities/mockMongoId";
import {getRandomString, getTestString} from "src/_test_utilities/specialCharacters";

export function getRandomModels(number: number): ModelDirectoryTypes.ModelInfo[] {
  const models: ModelDirectoryTypes.ModelInfo[] = [];
  for (let i = 0; i < number; i++) {
    const model: ModelDirectoryTypes.ModelInfo = {
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
    };
    models.push(model);
  }
  return models
}