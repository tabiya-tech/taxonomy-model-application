import { ObjectTypes } from "esco/common/objectTypes";

export const expected = [
  {
    requiringOccupationType: ObjectTypes.Occupation,
    requiringOccupationId: "mapped_key_1",
    relationType: "optional",
    requiredSkillId: "mapped_key_2",
  },
  {
    requiringOccupationType: ObjectTypes.Occupation,
    requiringOccupationId: "mapped_key_3",
    relationType: "essential",
    requiredSkillId: "mapped_key_4",
  },
  {
    requiringOccupationType: ObjectTypes.Occupation,
    requiringOccupationId: "mapped_key_7",
    relationType: "essential",
    requiredSkillId: "mapped_key_8",
  },
];
