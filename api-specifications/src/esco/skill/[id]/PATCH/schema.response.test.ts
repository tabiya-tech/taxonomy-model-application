import { randomUUID } from "crypto";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import SkillAPISpecs from "../../index";
import { getMockId } from "_test_utilities/mockMongoId";
import SkillEnums from "../../_shared/enums";
import { getTestString } from "../../../../_test_utilities/specialCharacters";

describe("SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload schema", () => {
  testValidSchema(
    "SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload",
    SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload
  );
});

describe("Test objects against the SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload schema", () => {
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.Relations.Parents.ObjectTypes.Skill,
  };

  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: SkillEnums.Relations.Children.ObjectTypes.Skill,
    isLocalized: true,
  };

  const givenRequiredSkill = {
    id: getMockId(3),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: false,
    objectType: SkillEnums.ObjectTypes.Skill,
    relationType: SkillEnums.SkillToSkillRelationType.ESSENTIAL,
  };

  const givenRequiredBySkill = {
    id: getMockId(4),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: true,
    objectType: SkillEnums.ObjectTypes.Skill,
    relationType: SkillEnums.SkillToSkillRelationType.OPTIONAL,
  };

  const givenRequiredByOccupation = {
    id: getMockId(5),
    UUID: randomUUID(),
    preferredLabel: getTestString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: true,
    objectType: SkillEnums.OccupationObjectTypes.ESCOOccupation,
    relationType: SkillEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: null,
    signallingValueLabel: null,
  };

  const givenValidSkillPATCHResponse = {
    id: getMockId(10),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID(), randomUUID()],
    originUUID: randomUUID(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    preferredLabel: getTestString(20),
    originUri: "https://foo/bar",
    altLabels: [getTestString(30), getTestString(40)],
    definition: getTestString(100),
    description: getTestString(100),
    scopeNote: getTestString(50),
    skillType: SkillEnums.SkillType.SkillCompetence,
    reuseLevel: SkillEnums.ReuseLevel.CrossSector,
    isLocalized: true,
    modelId: getMockId(20),
    parents: [givenParent],
    children: [givenChild],
    requiresSkills: [givenRequiredSkill],
    requiredBySkills: [givenRequiredBySkill],
    requiredByOccupations: [givenRequiredByOccupation],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  testSchemaWithValidObject(
    "SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload",
    SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload,
    givenValidSkillPATCHResponse
  );

  testSchemaWithAdditionalProperties(
    "SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload",
    SkillAPISpecs.Skill.PATCH.Schemas.Response.Payload,
    {
      ...givenValidSkillPATCHResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );
});
