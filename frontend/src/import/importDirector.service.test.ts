// ###########
// Setup mocks

// Setup the mock for the model.service
jest.mock("src/service/modelInfo/modelInfo.service", () => {
  // Mocking the ES5 class
  const mockModelService = jest.fn(); // the constructor
  mockModelService.prototype.createModel = jest.fn();
  mockModelService.prototype.getAllModels = jest.fn();
  return mockModelService;
});

// Setup the mock for the presigned.service
import * as Presigned from "api-specifications/presigned";

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
import * as ModelInfo from "api-specifications/modelInfo";
import {randomUUID} from "crypto";
import ImportDirectorService from "./importDirector.service";
import * as Import from "api-specifications/import";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import PresignedService from "./presigned/presigned.service";
import UploadService from "./upload/upload.service";
import ImportService from "./import/import.service";
import {ImportFiles} from "./ImportFiles.type";
import {getOneRandomModelMaxLength} from "src/modeldirectory/components/modelTables/_test_utilities/mockModelData";

describe('Test the import director service', () => {
  it("should successfully direct the import", async () => {
    // GIVEN a model service, a presigned service, an upload service, a import service

    const modelService = new ModelInfoService("foo");
    const givenMockModel = getOneRandomModelMaxLength();
    jest.spyOn(modelService, "createModel").mockResolvedValue(givenMockModel);

    const presignedService = new PresignedService("foo");
    const givenMockPresignedResponse: Presigned.Types.IPresignedResponse = {
      fields: [
        {name: "foo", value: "bar"},
        {name: "baz", value: "qux"}
      ], folder: "bar", url: "https://foo.bar"
    }
    jest.spyOn(presignedService, "getPresignedPost").mockResolvedValue(givenMockPresignedResponse);

    const uploadService = new UploadService();
    const importService = new ImportService("foo");

    // AND a name, description, locale and files
    const givenName = getTestString(ModelInfo.Constants.NAME_MAX_LENGTH);
    const givenDescription = getTestString(ModelInfo.Constants.DESCRIPTION_MAX_LENGTH);
    const givenLocale = {
      name: getTestString(ModelInfo.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(ModelInfo.Constants.LOCALE_SHORTCODE_MAX_LENGTH)
    }
    // AND a api server url
    const apiServerUrl = "https://somedomain/path/to/api";
    // AND some files
    const givenFiles: ImportFiles = {};
    Object.values(Import.Types.ImportFileTypes).forEach((fileType: Import.Types.ImportFileTypes) => {
      givenFiles[fileType] = new File(["foo bits"], `My File-${fileType}`, {type: 'text/plain'});
    });

    // WHEN the directImport() is called with the given arguments (name, description, locale, files)
    const manager = new ImportDirectorService(apiServerUrl);
    const actualModel = await manager.directImport(givenName, givenDescription, givenLocale, givenFiles);

    // #### MODEL SERVICE ####
    // THEN the model service is instantiated with the given api server url
    expect(ModelInfoService).toHaveBeenCalledWith(apiServerUrl);
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
    expect(uploadService.uploadFiles).toHaveBeenCalledWith(givenMockPresignedResponse, Object.entries(givenFiles).map(([, file]) => file));
    // AND the given files are uploaded
    // #### IMPORT SERVICE ####
    const givenFilesPaths: Import.Types.ImportFilePaths = {};
    Object.entries(givenFiles).forEach(([fileType, file])=> {
      givenFilesPaths[fileType as Import.Types.ImportFileTypes] = `${givenMockPresignedResponse.folder}/${file.name}`;
    });
    // THEN the import service is called with the given arguments (modelId, file paths)
    expect(importService.import).toHaveBeenCalledWith(givenMockModel.id, givenFilesPaths);
    // AND the processing of the files is started

    // AND when the processing is finished
    expect(actualModel).toEqual(givenMockModel);
  });
});