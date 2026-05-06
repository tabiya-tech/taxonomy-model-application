import { populateOccupationParentOptions, populateOccupationChildrenOptions } from "./occupationHierarchyOptions";
import { populateOccupationToSkillRelationRequiredSkill } from "./occupationToSkillRequiredSkillOptions";

describe("Populate Options Coverage", () => {
  describe("occupationHierarchyOptions", () => {
    test("populateOccupationParentOptions.populate.transform should return null if doc is null", () => {
      // @ts-ignore
      const result = populateOccupationParentOptions.populate.transform(null);
      expect(result).toBeNull();
    });

    test("populateOccupationParentOptions.populate.transform should return null if model name is unknown", () => {
      const mockDoc = {
        constructor: {
          modelName: "UnknownModel",
        },
      };
      // @ts-ignore
      const result = populateOccupationParentOptions.populate.transform(mockDoc);
      expect(result).toBeNull();
    });

    test("populateOccupationChildrenOptions.populate.transform should return null if doc is null", () => {
      // @ts-ignore
      const result = populateOccupationChildrenOptions.populate.transform(null);
      expect(result).toBeNull();
    });

    test("populateOccupationChildrenOptions.populate.transform should return null if model name is unknown", () => {
      const mockDoc = {
        constructor: {
          modelName: "UnknownModel",
        },
      };
      // @ts-ignore
      const result = populateOccupationChildrenOptions.populate.transform(mockDoc);
      expect(result).toBeNull();
    });
  });

  describe("occupationToSkillRequiredSkillOptions", () => {
    test("populateOccupationToSkillRelationRequiredSkill.transform should return null if doc is null", () => {
      // @ts-ignore
      const result = populateOccupationToSkillRelationRequiredSkill.transform(null);
      expect(result).toBeNull();
    });

    test("populateOccupationToSkillRelationRequiredSkill.transform should return null if model name is unknown", () => {
      const mockDoc = {
        constructor: {
          modelName: "UnknownModel",
        },
      };
      // @ts-ignore
      const result = populateOccupationToSkillRelationRequiredSkill.transform(mockDoc);
      expect(result).toBeNull();
    });
  });
});
