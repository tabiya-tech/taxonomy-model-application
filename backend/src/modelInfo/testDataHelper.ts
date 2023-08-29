import {IModelInfo} from "./modelInfoModel";
import {getMockId} from "_test_utilities/mockMongoId";
import {randomUUID} from "crypto";
import {getRandomString} from "_test_utilities/specialCharacters";
import {DESCRIPTION_MAX_LENGTH} from "esco/common/modelSchema";
import * as ModelInfo from 'api-specifications/modelInfo';


export function getIModelInfoMockData(n : number = 1 ): IModelInfo {
  return {
    id: getMockId(n),
    UUID: randomUUID(),
    previousUUID: randomUUID(),
    originUUID: randomUUID(),
    name: getRandomString(ModelInfo.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getRandomString(ModelInfo.Constants.NAME_MAX_LENGTH),
      shortCode: getRandomString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
    },
    description: getRandomString(DESCRIPTION_MAX_LENGTH),
    released: false,
    releaseNotes: getRandomString(ModelInfo.Constants.RELEASE_NOTES_MAX_LENGTH),
    version: getRandomString(ModelInfo.Constants.VERSION_MAX_LENGTH),
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date() //.toISOString()
  };
}
export function getModelInfoMockDataArray(n: number): Array<IModelInfo> {
  return Array.from({ length: n }, (_, index) => getIModelInfoMockData(index + 1));
}
