import { OccupationType } from "esco/common/objectTypes";

export const expected = [
  {
    requiringOccupationType: OccupationType.ESCO,
    requiringOccupationId: "mapped_key_1",
    relationType: "optional",
    requiredSkillId: "mapped_key_2",
  },
  {
    requiringOccupationType: OccupationType.ESCO,
    requiringOccupationId: "mapped_key_3",
    relationType: "essential",
    requiredSkillId: "mapped_key_4",
  },
  {
    requiringOccupationType: OccupationType.LOCAL,
    requiringOccupationId: "mapped_key_7",
    relationType: "essential",
    requiredSkillId: "mapped_key_8",
  },
  {
    requiringOccupationType: OccupationType.LOCALIZED,
    requiringOccupationId: "mapped_key_16",
    relationType: "essential",
    requiredSkillId: "mapped_key_17",
  },
];
