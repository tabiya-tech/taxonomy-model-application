import { ObjectTypes } from "esco/common/objectTypes";

export const expected = [
  {
    parentType: ObjectTypes.SkillGroup,
    parentId: "mapped_key_1",
    childId: "mapped_key_2",
    childType: ObjectTypes.SkillGroup,
  },
  {
    parentType: ObjectTypes.Skill,
    parentId: "mapped_key_3",
    childId: "mapped_key_4",
    childType: ObjectTypes.Skill,
  },
  {
    parentType: ObjectTypes.SkillGroup,
    parentId: "mapped_key_5",
    childId: "mapped_key_6",
    childType: ObjectTypes.Skill,
  },
];
