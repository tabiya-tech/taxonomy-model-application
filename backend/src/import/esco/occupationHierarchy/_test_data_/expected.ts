import { ObjectTypes } from "esco/common/objectTypes";

export const expected = [
  {
    parentType: ObjectTypes.ISCOGroup,
    parentId: "mapped_key_1",
    childId: "mapped_key_2",
    childType: ObjectTypes.ISCOGroup,
  },
  {
    parentType: ObjectTypes.ISCOGroup,
    parentId: "mapped_key_3",
    childId: "mapped_key_4",
    childType: ObjectTypes.ESCOOccupation,
  },
  {
    parentType: ObjectTypes.ISCOGroup,
    parentId: "mapped_key_5",
    childId: "mapped_key_6",
    childType: ObjectTypes.LocalOccupation,
  },
  {
    parentType: ObjectTypes.ESCOOccupation,
    parentId: "mapped_key_7",
    childId: "mapped_key_8",
    childType: ObjectTypes.ESCOOccupation,
  },
  {
    parentType: ObjectTypes.ESCOOccupation,
    parentId: "mapped_key_9",
    childId: "mapped_key_10",
    childType: ObjectTypes.LocalOccupation,
  },
  {
    parentType: ObjectTypes.ESCOOccupation,
    parentId: "mapped_key_11",
    childId: "mapped_key_12",
    childType: ObjectTypes.ISCOGroup,
  },
  {
    parentType: ObjectTypes.LocalOccupation,
    parentId: "mapped_key_13",
    childId: "mapped_key_14",
    childType: ObjectTypes.LocalOccupation,
  },
  {
    parentType: ObjectTypes.LocalOccupation,
    parentId: "mapped_key_15",
    childId: "mapped_key_16",
    childType: ObjectTypes.ESCOOccupation,
  },
];
