import Ajv from "ajv";
import addFormats from "ajv-formats";
import SkillAPISpecs from "./api-specifications/src/esco/skill/index";
import { getMockId } from "./api-specifications/src/_test_utilities/mockMongoId";
import { randomUUID } from "crypto";
import SkillEnums from "./api-specifications/src/esco/skill/enums";

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const schema = SkillAPISpecs.Schemas.GET.Parent.Response.Payload;

const givenFullSkillParent = {
  id: getMockId(2),
  UUID: randomUUID(),
  originUUID: randomUUID(),
  UUIDHistory: [randomUUID()],
  path: "https://foo/bar",
  tabiyaPath: "https://foo/bar",
  originUri: "https://foo/bar",
  preferredLabel: "test skill",
  altLabels: ["alt test"],
  definition: "test definition",
  description: "test description",
  scopeNote: "test scope note",
  skillType: SkillEnums.SkillType.Knowledge,
  reuseLevel: SkillEnums.ReuseLevel.CrossSector,
  isLocalized: true,
  objectType: SkillEnums.ObjectTypes.Skill,
  modelId: getMockId(1),
  parent: null,
  children: [],
  requiresSkills: [],
  requiredBySkills: [],
  requiredByOccupations: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const validate = ajv.compile(schema);
const valid = validate(givenFullSkillParent);
if (!valid) {
  console.log(JSON.stringify(validate.errors, null, 2));
} else {
  console.log("Valid!");
}
