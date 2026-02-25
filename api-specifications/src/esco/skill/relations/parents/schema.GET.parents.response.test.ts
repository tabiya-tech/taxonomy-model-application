import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";
import SkillAPISpecs from "../../index";
import {
  getValidSkillGroupParentItem,
  getValidSkillParentItem,
  getValidSkillParentsPaginatedResponse,
} from "./schemaTestData";

describe("Test Skill Parents Response Schema Validity", () => {
  testValidSchema(
    "SkillAPISpecs.Schemas.GET.Parents.Response.Payload",
    SkillAPISpecs.Schemas.GET.Parents.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Schemas.GET.Parents.Response.Payload schema", () => {
  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Parents.Response.Payload (empty data)",
    SkillAPISpecs.Schemas.GET.Parents.Response.Payload,
    getValidSkillParentsPaginatedResponse()
  );

  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Parents.Response.Payload (Skill)",
    SkillAPISpecs.Schemas.GET.Parents.Response.Payload,
    getValidSkillParentsPaginatedResponse({ data: [getValidSkillParentItem()] })
  );

  testSchemaWithValidObject(
    "SkillAPISpecs.Schemas.GET.Parents.Response.Payload (SkillGroup)",
    SkillAPISpecs.Schemas.GET.Parents.Response.Payload,
    getValidSkillParentsPaginatedResponse({ data: [getValidSkillGroupParentItem()] })
  );

  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Schemas.GET.Parents.Response.Payload",
    SkillAPISpecs.Schemas.GET.Parents.Response.Payload,
    {
      ...getValidSkillParentsPaginatedResponse({ data: [getValidSkillParentItem()] }),
      extraProperty: "extra",
    }
  );
});
