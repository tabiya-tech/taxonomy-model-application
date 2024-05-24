import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";

export const expected = [
  {
    requiringOccupationType: ObjectTypes.ESCOOccupation,
    requiringOccupationId: "mapped_key_1",
    relationType: "optional",
    requiredSkillId: "mapped_key_2",
    signallingValueLabel: SignallingValueLabel.NONE,
    signallingValue: null,
  },
  {
    requiringOccupationType: ObjectTypes.ESCOOccupation,
    requiringOccupationId: "mapped_key_3",
    relationType: "essential",
    requiredSkillId: "mapped_key_4",
    signallingValueLabel: SignallingValueLabel.NONE,
    signallingValue: null,
  },
  {
    requiringOccupationType: ObjectTypes.LocalOccupation,
    requiringOccupationId: "mapped_key_7",
    relationType: "essential",
    requiredSkillId: "mapped_key_8",
    signallingValueLabel: SignallingValueLabel.NONE,
    signallingValue: null,
  },
];
