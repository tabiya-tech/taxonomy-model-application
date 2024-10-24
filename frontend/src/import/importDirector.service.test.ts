// ###########
// Setup mocks

import PresignedAPISpecs from "api-specifications/presigned";

jest.mock("src/modelInfo/modelInfo.service", () => {
  // Mocking the ES5 class
  const mockModelService = jest.fn(); // the constructor
  mockModelService.prototype.createModel = jest.fn();
  mockModelService.prototype.getAllModels = jest.fn();
  return mockModelService;
});

// Setup the mock for the presigned.service

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

import { getTestString } from "src/_test_utilities/specialCharacters";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { randomUUID } from "crypto";
import ImportDirectorService from "./importDirector.service";
import ImportAPISpecs from "api-specifications/import";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import PresignedService from "./presigned/presigned.service";
import UploadService from "./upload/upload.service";
import ImportService from "./import/import.service";
import { ImportFiles } from "./ImportFiles.type";
import { getOneRandomModelMaxLength } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";

describe("Test the import director service", () => {
  it("should successfully direct the import", async () => {
    // GIVEN a model service, a presigned service, an upload service, a import service

    const modelService = new ModelInfoService("foo");
    const givenMockModel = getOneRandomModelMaxLength();
    jest.spyOn(modelService, "createModel").mockResolvedValue(givenMockModel);

    const presignedService = new PresignedService("foo");
    const givenMockPresignedResponse: PresignedAPISpecs.Types.GET.Response.Payload = {
      fields: [
        { name: "foo", value: "bar" },
        { name: "baz", value: "qux" },
      ],
      folder: "bar",
      url: "https://foo.bar",
    };
    jest.spyOn(presignedService, "getPresignedPost").mockResolvedValue(givenMockPresignedResponse);

    const uploadService = new UploadService();
    const importService = new ImportService("foo");

    // AND a name, description, license, locale and files
    const givenName = getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH);
    const givenDescription = getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH);
    const givenLicense = getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH);
    const givenLocale = {
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    };
    const givenUUIDHistory = [randomUUID(), randomUUID()];
    const givenOriginalESCOModel = true;
    // AND a api server url
    const apiServerUrl = "https://somedomain/path/to/api";
    // AND some files
    const givenFiles: ImportFiles = {};
    Object.values(ImportAPISpecs.Constants.ImportFileTypes).forEach(
      (fileType: ImportAPISpecs.Constants.ImportFileTypes) => {
        givenFiles[fileType] = new File(["foo bits"], `My File-${fileType}`, { type: "text/plain" });
      }
    );

    // WHEN the directImport() is called with the given arguments (name, description, locale, files)
    const manager = new ImportDirectorService(apiServerUrl);
    const actualModel = await manager.directImport(
      givenName,
      givenDescription,
      givenLicense,
      givenLocale,
      givenFiles,
      givenUUIDHistory,
      givenOriginalESCOModel
    );

    // #### MODEL SERVICE ####
    // THEN the model service is instantiated with the given api server url
    expect(ModelInfoService).toHaveBeenCalledWith(apiServerUrl);
    // AND the model service is called with the given arguments (name, description, locale),
    expect(modelService.createModel).toHaveBeenCalledWith({
      name: givenName,
      description: givenDescription,
      locale: givenLocale,
      license: givenLicense,
      UUIDHistory: givenUUIDHistory,
    });

    // #### PRESIGNED SERVICE ####
    // AND the presigned service is instantiated with the given api server url
    expect(PresignedService).toHaveBeenCalledWith(apiServerUrl);
    // AND the presigned service is called
    expect(presignedService.getPresignedPost).toBeCalled();

    // AND the upload service is called with the presigned url from the presigned service and the given files
    expect(uploadService.uploadFiles).toHaveBeenCalledWith(
      givenMockPresignedResponse,
      Object.entries(givenFiles).map(([, file]) => file)
    );
    // AND the given files are uploaded
    // #### IMPORT SERVICE ####
    const givenFilesPaths: ImportAPISpecs.Types.POST.Request.ImportFilePaths = {};
    Object.entries(givenFiles).forEach(([fileType, file]) => {
      givenFilesPaths[
        fileType as ImportAPISpecs.Constants.ImportFileTypes
      ] = `${givenMockPresignedResponse.folder}/${file.name}`;
    });
    // THEN the import service is called with the given arguments (modelId, file paths)
    expect(importService.import).toHaveBeenCalledWith(givenMockModel.id, givenFilesPaths, givenOriginalESCOModel);
    // AND the processing of the files is started

    // AND when the processing is finished
    expect(actualModel).toEqual(givenMockModel);
  });
});
