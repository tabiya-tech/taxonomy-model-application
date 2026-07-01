import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testArraySchemaFailureWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillAPISpecs from "../../../index";
import { getTestString } from "_test_utilities/specialCharacters";
import { getMockId } from "_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import LocaleAPISpecs from "locale";
import ImportProcessState from "importProcessState";
import { ExportProcessState } from "exportProcessState/enums";
import ModelInfoAPISpecs from "modelInfo";

// Each history item is a full ModelInfo object built from a deep copy of modelInfo's _baseResponseSchema.
// The per-field validation of that shape is covered centrally in modelInfo/schemas.base.test.ts, so this
// test only asserts the history-specific concerns: schema validity, a valid array of items, rejection of
// additional properties, and that a bare object (non-array) is rejected.
describe("Test Skill History Response Schema Validity", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    [LocaleAPISpecs.Schemas.Payload]
  );
});

describe("Test objects against the Skill History Response Schema", () => {
  const givenExportProcessState = {
    id: getMockId(2),
    status: ExportProcessState.Enums.Status.PENDING,
    result: { errored: false, exportErrors: false, exportWarnings: false },
    downloadUrl: "https://foo/bar",
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const givenImportProcessState = {
    id: getMockId(1),
    status: ImportProcessState.Enums.Status.PENDING,
    result: { errored: false, parsingErrors: false, parsingWarnings: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const givenModelHistory = {
    id: getMockId(1),
    UUID: randomUUID(),
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    localeShortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
  };

  const givenValidHistoryItem = {
    id: getMockId(1),
    UUID: randomUUID(),
    modelHistory: [givenModelHistory],
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    description: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    locale: {
      name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
      UUID: randomUUID(),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    releaseNotes: getTestString(ModelInfoAPISpecs.Constants.RELEASE_NOTES_MAX_LENGTH),
    released: false,
    version: getTestString(ModelInfoAPISpecs.Constants.VERSION_MAX_LENGTH),
    exportProcessState: [givenExportProcessState],
    importProcessState: givenImportProcessState,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const givenSecondValidHistoryItem = { ...givenValidHistoryItem, id: getMockId(2), UUID: randomUUID() };

  testSchemaWithValidObject(
    "SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload (single item)",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [LocaleAPISpecs.Schemas.Payload]
  );

  testSchemaWithValidObject(
    "SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload (multiple items)",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem, givenSecondValidHistoryItem],
    [LocaleAPISpecs.Schemas.Payload]
  );

  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    [givenValidHistoryItem],
    [LocaleAPISpecs.Schemas.Payload]
  );

  testArraySchemaFailureWithValidObject(
    "SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload",
    SkillAPISpecs.Skill.History.GET.Schemas.Response.Payload,
    givenValidHistoryItem,
    [LocaleAPISpecs.Schemas.Payload]
  );
});
