import { randomUUID } from "crypto";
import {
  testSchemaWithAdditionalProperties,
  testSchemaWithValidObject,
  testValidSchema,
} from "_test_utilities/stdSchemaTests";

import OccupationAPISpecs from "../../index";
import { getMockId } from "_test_utilities/mockMongoId";
import OccupationEnums from "../../_shared/enums";
import OccupationConstants from "../../_shared/constants";
import { getTestString } from "../../../../_test_utilities/specialCharacters";
import {
  getTestESCOOccupationCode,
  getTestESCOLocalOccupationCode,
  getTestISCOGroupCode,
} from "../../../_test_utilities/testUtils";

describe("Test OccupationAPISpecs schema validity", () => {
  testValidSchema(
    "OccupationAPISpecs.Occupation.PATCH.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Response.Payload
  );
});

describe("Test objects against the OccupationAPISpecs.Occupation.PATCH.Schemas.Response.Payload schema", () => {
  const givenParent = {
    id: getMockId(1),
    UUID: randomUUID(),
    code: getTestISCOGroupCode(),
    occupationGroupCode: getTestISCOGroupCode(),
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationEnums.Relations.Parent.ObjectTypes.ISCOGroup,
  };

  const givenChild = {
    id: getMockId(2),
    UUID: randomUUID(),
    code: getTestESCOLocalOccupationCode(),
    preferredLabel: getTestString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    objectType: OccupationEnums.Relations.Children.ObjectTypes.LocalOccupation,
  };

  const givenSkill = {
    id: getMockId(1),
    UUID: randomUUID(),
    preferredLabel: getTestString(OccupationConstants.PREFERRED_LABEL_MAX_LENGTH),
    isLocalized: true,
    objectType: OccupationEnums.Relations.RequiredSkills.ObjectTypes.Skill,
    relationType: OccupationEnums.OccupationToSkillRelationType.ESSENTIAL,
    signallingValue: null,
    signallingValueLabel: null,
  };

  const givenValidOccupationPATCHResponse = {
    id: getMockId(4),
    UUID: randomUUID(),
    UUIDHistory: [randomUUID(), randomUUID()],
    originUUID: randomUUID(),
    code: getTestESCOOccupationCode(),
    path: "https://path/to/tabiya",
    tabiyaPath: "https://path/to/tabiya",
    originUri: "https://foo/bar",
    occupationGroupCode: getTestISCOGroupCode(),
    description: getTestString(50),
    preferredLabel: getTestString(20),
    altLabels: [getTestString(OccupationConstants.ALT_LABEL_MAX_LENGTH)],
    definition: getTestString(100),
    regulatedProfessionNote: getTestString(75),
    scopeNote: getTestString(60),
    occupationType: OccupationEnums.OccupationType.ESCOOccupation,
    modelId: getMockId(5),
    isLocalized: true,
    parent: givenParent,
    children: [givenChild],
    requiresSkills: [givenSkill],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  testSchemaWithValidObject(
    "OccupationAPISpecs.Occupation.PATCH.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Response.Payload,
    givenValidOccupationPATCHResponse
  );

  testSchemaWithAdditionalProperties(
    "OccupationAPISpecs.Occupation.PATCH.Schemas.Response.Payload",
    OccupationAPISpecs.Occupation.PATCH.Schemas.Response.Payload,
    {
      ...givenValidOccupationPATCHResponse,
      extraProperty: "extra test property (not defined in schema) for testing additionalProperties",
    }
  );
});
