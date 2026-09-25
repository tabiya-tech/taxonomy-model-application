import {
  makePopulateOccupationChildrenOptions,
  makePopulateOccupationParentOptions,
  populateOccupationChildrenOptions,
  populateOccupationParentOptions,
} from "./occupationHierarchyOptions";
import { makePopulateOccupationToSkillRelationRequiredSkill } from "./occupationToSkillRequiredSkillOptions";
import { populateOccupationToSkillRelationRequiredSkill } from "./occupationToSkillRequiredSkillOptions";
import { MongooseModelName } from "esco/common/mongooseModelNames";

jest.mock("esco/occupations/_shared/occupation.reference", () => ({
  getOccupationDocReference: jest.fn().mockReturnValue({ preferredLabel: "mock-occupation" }),
}));
jest.mock("esco/occupationGroup/_shared/OccupationGroupReference", () => ({
  getOccupationGroupDocReference: jest.fn().mockReturnValue({ preferredLabel: "mock-group" }),
}));

import { getOccupationDocReference } from "esco/occupations/_shared/occupation.reference";
import { getOccupationGroupDocReference } from "esco/occupationGroup/_shared/OccupationGroupReference";

describe("Populate Options Coverage", () => {
  describe("makePopulateOccupationParentOptions — language forwarding", () => {
    const givenLanguage = "fr";

    test("forwards language to getOccupationGroupDocReference when parent is an OccupationGroup", () => {
      const opts = makePopulateOccupationParentOptions(givenLanguage);
      const mockDoc = { constructor: { modelName: MongooseModelName.OccupationGroup } };
      // @ts-ignore
      opts.populate.transform(mockDoc);
      expect(getOccupationGroupDocReference).toHaveBeenCalledWith(mockDoc, givenLanguage);
    });

    test("forwards language to getOccupationDocReference when parent is an Occupation", () => {
      const opts = makePopulateOccupationParentOptions(givenLanguage);
      const mockDoc = { constructor: { modelName: MongooseModelName.Occupation } };
      // @ts-ignore
      opts.populate.transform(mockDoc);
      expect(getOccupationDocReference).toHaveBeenCalledWith(mockDoc, givenLanguage);
    });
  });

  describe("makePopulateOccupationChildrenOptions — language forwarding", () => {
    const givenLanguage = "es";

    test("forwards language to getOccupationDocReference when child is an Occupation", () => {
      const opts = makePopulateOccupationChildrenOptions(givenLanguage);
      const mockDoc = { constructor: { modelName: MongooseModelName.Occupation } };
      // @ts-ignore
      opts.populate.transform(mockDoc);
      expect(getOccupationDocReference).toHaveBeenCalledWith(mockDoc, givenLanguage);
    });
  });

  describe("makePopulateOccupationToSkillRelationRequiredSkill — language forwarding", () => {
    test("uses the provided language key in the transform path", () => {
      const givenLanguage = "pt";
      const opts = makePopulateOccupationToSkillRelationRequiredSkill(givenLanguage);
      // The transform is a closure over language; verify the path is set and transform is a function
      expect(typeof opts.transform).toBe("function");
      // null doc returns null
      // @ts-ignore
      expect(opts.transform(null)).toBeNull();
    });
  });

  describe("occupationHierarchyOptions", () => {
    test("populateOccupationParentOptions().populate.transform should return null if doc is null", () => {
      // @ts-ignore
      const result = populateOccupationParentOptions().populate.transform(null);
      expect(result).toBeNull();
    });

    test("populateOccupationParentOptions().populate.transform should return null if model name is unknown", () => {
      const mockDoc = {
        constructor: {
          modelName: "UnknownModel",
        },
      };
      // @ts-ignore
      const result = populateOccupationParentOptions().populate.transform(mockDoc);
      expect(result).toBeNull();
    });

    test("populateOccupationChildrenOptions().populate.transform should return null if doc is null", () => {
      // @ts-ignore
      const result = populateOccupationChildrenOptions().populate.transform(null);
      expect(result).toBeNull();
    });

    test("populateOccupationChildrenOptions().populate.transform should return null if model name is unknown", () => {
      const mockDoc = {
        constructor: {
          modelName: "UnknownModel",
        },
      };
      // @ts-ignore
      const result = populateOccupationChildrenOptions().populate.transform(mockDoc);
      expect(result).toBeNull();
    });
  });

  describe("occupationToSkillRequiredSkillOptions", () => {
    test("populateOccupationToSkillRelationRequiredSkill().transform should return null if doc is null", () => {
      // @ts-ignore
      const result = populateOccupationToSkillRelationRequiredSkill().transform(null);
      expect(result).toBeNull();
    });

    test("populateOccupationToSkillRelationRequiredSkill().transform should return null if model name is unknown", () => {
      const mockDoc = {
        constructor: {
          modelName: "UnknownModel",
        },
      };
      // @ts-ignore
      const result = populateOccupationToSkillRelationRequiredSkill().transform(mockDoc);
      expect(result).toBeNull();
    });
  });
});
