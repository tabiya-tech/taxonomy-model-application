import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import { getRandomString } from "_test_utilities/specialCharacters";
import { DESCRIPTION_MAX_LENGTH } from "esco/common/modelSchema";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { IModelInfo } from "./modelInfo.types";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState/";

export function getIModelInfoMockData(n: number = 1): IModelInfo {
  return {
    id: getMockStringId(n),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID()],
    name: getRandomString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getRandomString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getRandomString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getRandomString(DESCRIPTION_MAX_LENGTH),
    license: getRandomString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    released: false,
    releaseNotes: getRandomString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
    version: getRandomString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    importProcessState: {
      id: getMockStringId(100000 + n),
      status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
      result: {
        errored: false,
        parsingErrors: false,
        parsingWarnings: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    exportProcessState: [
      {
        id: getMockStringId(200000 + n),
        status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
        result: {
          errored: false,
          exportErrors: false,
          exportWarnings: false,
        },
        downloadUrl: "https://foo.bar/" + n,
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date(), //.toISOString()
  };
}

export function getModelInfoMockDataArray(n: number): Array<IModelInfo> {
  return Array.from({ length: n }, (_, index) => getIModelInfoMockData(index + 1));
}
