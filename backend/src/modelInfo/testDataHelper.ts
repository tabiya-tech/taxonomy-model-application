import {
  IModelInfo,
  NAME_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH,
  SHORTCODE_MAX_LENGTH,
  VERSION_MAX_LENGTH
} from "./modelInfoModel";
import {getMockId} from "_test_utilities/mockMongoId";
import {randomUUID} from "crypto";
import {getRandomString} from "_test_utilities/specialCharacters";
import {DESCRIPTION_MAX_LENGTH} from "esco/common/modelSchema";


export function getIModelInfoMockData(n : number = 1 ): IModelInfo {
  return {
    id: getMockId(n),
    UUID: randomUUID(),
    previousUUID: randomUUID(),
    originUUID: randomUUID(),
    name: getRandomString(NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getRandomString(NAME_MAX_LENGTH),
      shortCode: getRandomString(SHORTCODE_MAX_LENGTH)
    },
    description: getRandomString(DESCRIPTION_MAX_LENGTH),
    released: false,
    releaseNotes: getRandomString(RELEASE_NOTES_MAX_LENGTH),
    version: getRandomString(VERSION_MAX_LENGTH),
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date() //.toISOString()
  };
}
export function getModelInfoMockDataArray(n: number): Array<IModelInfo> {
  return Array.from({ length: n }, (_, index) => getIModelInfoMockData(index + 1));
}
