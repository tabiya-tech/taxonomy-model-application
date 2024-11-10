import { ObjectTypes } from "./objectTypes";
import { getModelName, MongooseModelName } from "./mongooseModelNames";

describe("test getModelName()", () => {
  it.each([
    [ObjectTypes.ESCOOccupation, MongooseModelName.Occupation],
    [ObjectTypes.LocalOccupation, MongooseModelName.Occupation],
    [ObjectTypes.Skill, MongooseModelName.Skill],
    [ObjectTypes.SkillGroup, MongooseModelName.SkillGroup],
    [ObjectTypes.ISCOGroup, MongooseModelName.OccupationGroup],
    [ObjectTypes.LocalGroup, MongooseModelName.OccupationGroup],
  ])("getModelName('%s') should return '%s'", (givenObjectType, expectedModelName) => {
    expect(getModelName(givenObjectType)).toEqual(expectedModelName);
  });
  it("getModelName('Unknown') should throw an error", () => {
    expect(() => getModelName("Unknown" as ObjectTypes)).toThrowError("Unknown object type: Unknown");
  });
});
