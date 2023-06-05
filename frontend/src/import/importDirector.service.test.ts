// ###########
// Setup mocks

// Setup the mock for the model.service
import {getMockId} from "src/_test_utilities/mockMongoId";

jest.mock("./model/model.service", () => {
  // Mocking the ES5 class
  const mockModelService = jest.fn(); // the constructor
  mockModelService.prototype.createModel = jest.fn();
  return mockModelService;
});

// Setup the mock for the presigned.service
import {IPresignedResponse} from "api-specifications/presigned";

jest.mock("./presigned/presigned.service", () => {
  const mockPresignedService = jest.fn(); // the constructor
  mockPresignedService.prototype.getPresignedPost = jest.fn();
  return mockPresignedService;
});

// Setup the mock for the upload.service
jest.mock("./upload/upload.service", () => {
  // Mocking the ES5 class
  const mockUploadService = jest.fn(); // the constructor
  mockUploadService.prototype.uploadFiles = jest.fn();
  return mockUploadService;
});

jest.mock("./import/import.service", () => {
  // Mocking the ES5 class
  const mockImportService = jest.fn(); // the constructor
  mockImportService.prototype.import = jest.fn();
  return mockImportService;
});

// ###########

import {getTestString} from "src/_test_utilities/specialCharacters";
import {NAME_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, LOCALE_SHORTCODE_MAX_LENGTH} from "api-specifications/modelInfo";
import {randomUUID} from "crypto";
import ImportDirectorService from "./importDirector.service";
import {ImportFileTypes} from "api-specifications/import";
import ModelService from "./model/model.service";
import PresignedService from "./presigned/presigned.service";
import UploadService from "./upload/upload.service";
import ImportService from "./import/import.service";

describe('Test the import director service', () => {
  it("should successfully direct the import", async () => {
    // GIVEN a model service, a presigned service, an upload service, a import service

    const modelService = new ModelService("foo");
    const givenMockModelId = getMockId(1);
    jest.spyOn(modelService, "createModel").mockResolvedValue(givenMockModelId);

    const presignedService = new PresignedService("foo");
    const givenMockPresignedResponse: IPresignedResponse = {
      fields: [
        {name: "foo", value: "bar"},
        {name: "baz", value: "qux"}
      ], folder: "bar", url: "http://foo.bar"
    }
    jest.spyOn(presignedService, "getPresignedPost").mockResolvedValue(givenMockPresignedResponse);

    const uploadService = new UploadService();
    const importService = new ImportService("foo");

    // AND a name, description, locale and files
    const givenName = getTestString(NAME_MAX_LENGTH);
    const givenDescription = getTestString(DESCRIPTION_MAX_LENGTH);
    const givenLocale = {
      name: getTestString(NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(LOCALE_SHORTCODE_MAX_LENGTH)
    }
    // AND a api server url
    const apiServerUrl = "https://somedomain/path/to/api";
    // AND some files
    const givenFiles: { fileType: ImportFileTypes, file: File }[] = [
      {fileType: ImportFileTypes.ESCO_SKILL, file: new File(["foo"], "foo.csv")},
      {fileType: ImportFileTypes.OCCUPATION_HIERARCHY, file: new File(["bar"], "bar.json")},
    ]

    // WHEN the directImport() is called with the given arguments (name, description, locale, files)
    const manager = new ImportDirectorService(apiServerUrl);
    const actualModelId = await manager.directImport(givenName, givenDescription, givenLocale, givenFiles);

    // #### MODEL SERVICE ####
    // THEN the model service is instantiated with the given api server url
    expect(ModelService).toHaveBeenCalledWith(apiServerUrl);
    // AND the model service is called with the given arguments (name, description, locale),
    expect(modelService.createModel).toHaveBeenCalledWith({
      name: givenName,
      description: givenDescription,
      locale: givenLocale
    });

    // #### PRESIGNED SERVICE ####
    // AND the presigned service is instantiated with the given api server url
    expect(PresignedService).toHaveBeenCalledWith(apiServerUrl);
    // AND the presigned service is called
    expect(presignedService.getPresignedPost).toBeCalled();

    // AND the upload service is called with the presigned url from the presigned service and the given files
    expect(uploadService.uploadFiles).toHaveBeenCalledWith(givenMockPresignedResponse, givenFiles.map(file => file.file));
    // AND the given files are uploaded
    // #### IMPORT SERVICE ####
    const givenFilesPaths: { [key: string]: string } = {
      [ImportFileTypes.ESCO_SKILL]: `${givenMockPresignedResponse.folder}/foo.csv`,
      [ImportFileTypes.OCCUPATION_HIERARCHY]: `${givenMockPresignedResponse.folder}/bar.json`,
    }
    // THEN the import service is called with the given arguments (modelId, file paths)
    expect(importService.import).toHaveBeenCalledWith(givenMockModelId, givenFilesPaths);
    // AND the processing of the files is started

    // AND when the processing is finished
    expect(actualModelId).toEqual(givenMockModelId);
  });
});