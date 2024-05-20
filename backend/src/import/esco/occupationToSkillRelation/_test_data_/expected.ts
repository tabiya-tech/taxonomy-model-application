import { ObjectTypes } from "esco/common/objectTypes";

export const expected = [
  {
    requiringOccupationType: ObjectTypes.ESCOOccupation,
    requiringOccupationId: "mapped_key_1",
    relationType: "optional",
    requiredSkillId: "mapped_key_2",
    signallingValueLabel: "low",
    signallingValue: 0.1,
  },
  {
    requiringOccupationType: ObjectTypes.ESCOOccupation,
    requiringOccupationId: "mapped_key_3",
    relationType: "essential",
    requiredSkillId: "mapped_key_4",
    signallingValueLabel: "medium",
    signallingValue: 0.5,
  },
  {
    requiringOccupationType: ObjectTypes.LocalOccupation,
    requiringOccupationId: "mapped_key_7",
    relationType: "essential",
    requiredSkillId: "mapped_key_8",
    signallingValueLabel: "high",
    signallingValue: 1,
  },
  {
    requiringOccupationType: ObjectTypes.ESCOOccupation,
    requiringOccupationId: "mapped_key_15",
    relationType: "",
    requiredSkillId: "mapped_key_16",
    signallingValueLabel: "",
    signallingValue: null,
  },
];
