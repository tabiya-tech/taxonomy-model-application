// mute the console output
import "_test_utilities/consoleMock";

import { Connection } from "mongoose";
import { randomUUID } from "crypto";
import { getTestString } from "_test_utilities/specialCharacters";
import { getNewConnection } from "server/connection/newConnection";
import { RepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { IModelInfo, INewModelInfoSpec } from "./modelInfo.types";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import { IImportProcessState } from "../import/ImportProcessState/importProcessState.types";

/**
 * Helper function to create an INewModelInfoSpec with random values,
 * that can be used for creating a new ISkillGroup
 */
function getNewModelInfoSpec(): INewModelInfoSpec {
  return {
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
  };
}

describe("Test populating the ModelInfo.ImportProcessState with an in-memory mongodb", () => {
  let dbConnection: Connection;
  const repositoryRegistry = new RepositoryRegistry();

  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("PopulateModelRepositoryTestDB");
    dbConnection = await getNewConnection(config.dbURI);
    await repositoryRegistry.initialize(dbConnection);
  });

  afterAll(async () => {
    if (dbConnection) {
      await dbConnection.dropDatabase();
      await dbConnection.close(false); // do not force close as there might be pending mongo operations
    }
  });

  describe("Test Model with without existing ImportProcessState", () => {
    let givenModel: IModelInfo;

    beforeAll(async () => {
      // GIVEN a model info exists in the database
      givenModel = await repositoryRegistry.modelInfo.create(getNewModelInfoSpec());
    });

    afterAll(async () => {
      await repositoryRegistry.modelInfo.Model.deleteMany({});
    });

    test("Test create()", async () => {
      // THEN expect the import process state to be populated with the PENDING status
      expect(givenModel.importProcessState).toEqual({
        id: expect.any(String),
        status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
        result: {
          errored: false,
          parsingErrors: false,
          parsingWarnings: false,
        },
      });
    });

    test("Test getModelById()", async () => {
      // WHEN retrieving the model by its id
      const actualFoundModel: IModelInfo = (await repositoryRegistry.modelInfo.getModelById(
        givenModel.id
      )) as IModelInfo;

      // THEN expect the import process state to be populated with the PENDING status
      expect(actualFoundModel.importProcessState).toEqual({
        id: givenModel.importProcessState.id,
        status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
        result: {
          errored: false,
          parsingErrors: false,
          parsingWarnings: false,
        },
      });
    });

    test("Test getModelByUUID()", async () => {
      // WHEN retrieving the model by its id
      const actualFoundModel: IModelInfo = (await repositoryRegistry.modelInfo.getModelByUUID(
        givenModel.UUID
      )) as IModelInfo;

      // THEN expect the import process state to be populated with the PENDING status
      expect(actualFoundModel.importProcessState).toEqual({
        id: givenModel.importProcessState.id,
        status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
        result: {
          errored: false,
          parsingErrors: false,
          parsingWarnings: false,
        },
      });
    });

    test("Test getModels()", async () => {
      // WHEN retrieving the models from the database
      const actualFoundModels: IModelInfo[] = await repositoryRegistry.modelInfo.getModels();

      // THEN expect the import process state to be populated with the values from the import process state
      expect(actualFoundModels.length).toEqual(1);
      expect(actualFoundModels[0].importProcessState).toEqual({
        id: givenModel.importProcessState.id,
        status: ImportProcessStateAPISpecs.Enums.Status.PENDING,
        result: {
          errored: false,
          parsingErrors: false,
          parsingWarnings: false,
        },
      });
    });
  });

  describe("Test Model with existing ImportProcessState", () => {
    let givenModel: IModelInfo;
    let givenImportProcessState: IImportProcessState;

    beforeAll(async () => {
      // GIVEN a model info exists in the database
      givenModel = await repositoryRegistry.modelInfo.create(getNewModelInfoSpec());
      expect(givenModel.importProcessState).toBeDefined();
      // AND the import process has started for the model
      givenImportProcessState = await repositoryRegistry.importProcessState.create({
        id: givenModel.importProcessState.id,
        modelId: givenModel.id,
        status: ImportProcessStateAPISpecs.Enums.Status.RUNNING,
        result: {
          errored: true,
          parsingErrors: true,
          parsingWarnings: true,
        },
      });
    });

    afterAll(async () => {
      await repositoryRegistry.importProcessState.Model.deleteMany({});
      await repositoryRegistry.modelInfo.Model.deleteMany({});
    });

    test("Test getModelById()", async () => {
      // WHEN retrieving the model by its id
      const actualFoundModel: IModelInfo = (await repositoryRegistry.modelInfo.getModelById(
        givenModel.id
      )) as IModelInfo;

      // THEN expect the import process state to be populated with the values from the import process state
      expect(actualFoundModel.importProcessState).toEqual({
        id: givenImportProcessState.id,
        status: givenImportProcessState.status,
        result: givenImportProcessState.result,
      });
    });

    test("Test getModelByUUID()", async () => {
      // WHEN retrieving the model by its id
      const actualFoundModel: IModelInfo = (await repositoryRegistry.modelInfo.getModelByUUID(
        givenModel.UUID
      )) as IModelInfo;

      // THEN expect the import process state to be populated with the values from the import process state
      expect(actualFoundModel.importProcessState).toEqual({
        id: givenImportProcessState.id,
        status: givenImportProcessState.status,
        result: givenImportProcessState.result,
      });
    });

    test("Test getModels()", async () => {
      // WHEN retrieving the models from the database
      const actualFoundModels: IModelInfo[] = await repositoryRegistry.modelInfo.getModels();

      // THEN expect the import process state to be populated with the values from the import process state
      expect(actualFoundModels.length).toEqual(1);
      expect(actualFoundModels[0].importProcessState).toEqual({
        id: givenImportProcessState.id,
        status: givenImportProcessState.status,
        result: givenImportProcessState.result,
      });
    });
  });
});
