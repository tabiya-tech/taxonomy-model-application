import { ObjectTypes } from "./objectTypes";
import { getModelName, MongooseModelName } from "./mongooseModelNames";

describe("Mongoose Model Names", () => {
  it.each([
    [ObjectTypes.Occupation, MongooseModelName.Occupation],
    [ObjectTypes.Skill, MongooseModelName.Skill],
    [ObjectTypes.SkillGroup, MongooseModelName.SkillGroup],
    [ObjectTypes.ISCOGroup, MongooseModelName.ISCOGroup],
  ])("getModelName('%s') should return '%s'", (givenObjectType, expectedModelName) => {
    expect(getModelName(givenObjectType)).toEqual(expectedModelName);
  });
  it("getModelName('Unknown') should throw an error", () => {
    expect(() => getModelName("Unknown" as ObjectTypes)).toThrowError("Unknown object type: Unknown");
  });
});
