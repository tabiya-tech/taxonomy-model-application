// ###########
// Setup mocks

// Setup the mock for the model.service
jest.mock("./model/model.service", () => {
  const getMockId = require("src/_test_utilities/mockMongoId").getMockId;
  // Mocking the ES5 class
  const mockModelService = jest.fn(); // the constructor
  mockModelService.prototype.createModel = jest.fn().mockResolvedValue(getMockId(1));// adding a mock method
  return mockModelService;
});

// Setup the mock for the presigned.service
import {IPresignedResponse} from "api-specifications/presigned";
jest.mock("./presigned/presigned.service", () => {
  const mockPresignedService = jest.fn(); // the constructor
  const mockPresignedResponse: IPresignedResponse = {
    fields: [
      {name: "foo", value: "bar"},
      {name: "baz", value: "qux"}
    ], key: "bar", url: "http://foo.bar"
  }
  mockPresignedService.prototype.getPresignedPost = jest.fn().mockResolvedValue(mockPresignedResponse); // adding a mock method
  return mockPresignedService;
});

// Setup the mock for the upload.service
jest.mock("./upload/upload.service", () => {
  // Mocking the ES5 class
  const mockUploadService = jest.fn(); // the constructor
  mockUploadService.prototype.uploadFiles = jest.fn().mockResolvedValue(undefined);// adding a mock method
  return mockUploadService;
});

// TODO: mock import service

// ###########

import {getTestString} from "../_test_utilities/specialCharacters";
import {NAME_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, LOCALE_SHORTCODE_MAX_LENGTH} from "api-specifications/modelInfo";
import {randomUUID} from "crypto";
import ImportDirectorService from "./importDirector.service";

import ModelService from "./model/model.service";
import PresignedService from "./presigned/presigned.service";
import UploadService from "./upload/upload.service";

describe('Test the import director service', () => {
  it("should successfully direct the import", async () => {
    // GIVEN a model service, a presigned service, an upload service, a import service

    const modelService = new ModelService("foo");
    const presignedService = new PresignedService("foo");
    const uploadService = new UploadService();
    // TODO: import service

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
    const givenFiles = [
      new File(["foo"], "foo.txt", {type: 'text/csv'}),
      new File(["bar"], "bar.txt", {type: 'text/csv'})
    ];

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
    // AND the model is created
    const mockedModelId = (modelService.createModel as jest.Mock).mock.results[0].value;

    // #### PRESIGNED SERVICE ####
    // AND the presigned service is instantiated with the given api server url
    expect(PresignedService).toHaveBeenCalledWith(apiServerUrl);
    // AND the presigned service is called
    expect(presignedService.getPresignedPost).toBeCalled();
    // AND a presigned url is retrieved
    const presignedUrl = (presignedService.getPresignedPost as jest.Mock).mock.results[0].value;


    // AND the upload service is called with the presigned url from the presigned service and the given files
    expect(uploadService.uploadFiles).toHaveBeenCalledWith(presignedUrl, givenFiles);
    // AND the given files are uploaded

    // #### IMPORT SERVICE ####
    // TODO: import service
    // THEN the import service is called with the given arguments (modelId, file urls)
    // AND the processing of the files is started


    // AND when the processing is finished
    expect(actualModelId).toEqual(mockedModelId);

  });
});