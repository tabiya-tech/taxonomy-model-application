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
  getValidSkillRelationRequestQuery,
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

  describe("Test schemaTestData.ts default parameter handling", () => {
    test("getValidSkillParentsPaginatedResponse should handle custom data and assign default limit", () => {
      const response = getValidSkillParentsPaginatedResponse({ data: [getValidSkillParentItem()] });
      expect(response.data).toHaveLength(1);
      expect(response.limit).toBeDefined(); // default limit
    });

    test("getValidSkillParentsPaginatedResponse should handle custom limit and assign default empty data", () => {
      const response = getValidSkillParentsPaginatedResponse({ limit: 10 });
      expect(response.data).toEqual([]);
      expect(response.limit).toBe(10);
    });

    test("getValidSkillParentsPaginatedResponse should handle custom nextCursor", () => {
      const response = getValidSkillParentsPaginatedResponse({ nextCursor: "foo" });
      expect(response.nextCursor).toBe("foo");
      expect(response.data).toEqual([]);
    });

    test("getValidSkillParentItem and getValidSkillGroupParentItem should return valid items with default properties", () => {
      const item1 = getValidSkillParentItem();
      expect(item1.id).toBeDefined();
      const item2 = getValidSkillGroupParentItem();
      expect(item2.id).toBeDefined();
    });

    test("getValidSkillRelationRequestQuery should return a valid query with default limit and cursor", () => {
      const query = getValidSkillRelationRequestQuery();
      expect(query.limit).toBeDefined();
      expect(query.cursor).toBeDefined();
    });
  });
});
