import { ObjectTypes } from "esco/common/objectTypes";

export const expected = [
  {
    parentType: ObjectTypes.ISCOGroup,
    parentId: "mapped_key_1",
    childId: "mapped_key_2",
    childType: ObjectTypes.ISCOGroup,
  },
  {
    parentType: ObjectTypes.LocalGroup,
    parentId: "mapped_key_3",
    childId: "mapped_key_4",
    childType: ObjectTypes.LocalGroup,
  },
  {
    parentType: ObjectTypes.ISCOGroup,
    parentId: "mapped_key_5",
    childId: "mapped_key_6",
    childType: ObjectTypes.ESCOOccupation,
  },
  {
    parentType: ObjectTypes.LocalGroup,
    parentId: "mapped_key_i7",
    childId: "mapped_key_8",
    childType: ObjectTypes.ESCOOccupation,
  },
  {
    parentType: ObjectTypes.ISCOGroup,
    parentId: "mapped_key_9",
    childId: "mapped_key_10",
    childType: ObjectTypes.LocalOccupation,
  },
  {
    parentType: ObjectTypes.LocalGroup,
    parentId: "mapped_key_11",
    childId: "mapped_key_12",
    childType: ObjectTypes.LocalOccupation,
  },
  {
    parentType: ObjectTypes.ESCOOccupation,
    parentId: "mapped_key_13",
    childId: "mapped_key_14",
    childType: ObjectTypes.ESCOOccupation,
  },
  {
    parentType: ObjectTypes.ESCOOccupation,
    parentId: "mapped_key_15",
    childId: "mapped_key_16",
    childType: ObjectTypes.LocalOccupation,
  },
  {
    parentType: ObjectTypes.ESCOOccupation,
    parentId: "mapped_key_17",
    childId: "mapped_key_18",
    childType: ObjectTypes.ISCOGroup,
  },
  {
    parentType: ObjectTypes.ESCOOccupation,
    parentId: "mapped_key_19",
    childId: "mapped_key_20",
    childType: ObjectTypes.LocalGroup,
  },
  {
    parentType: ObjectTypes.LocalOccupation,
    parentId: "mapped_key_21",
    childId: "mapped_key_22",
    childType: ObjectTypes.LocalOccupation,
  },
  {
    parentType: ObjectTypes.LocalOccupation,
    parentId: "mapped_key_23",
    childId: "mapped_key_24",
    childType: ObjectTypes.ESCOOccupation,
  },
  {
    parentType: ObjectTypes.ISCOGroup,
    parentId: "mapped_key_25",
    childId: "mapped_key_26",
    childType: ObjectTypes.LocalOccupation,
  },
];
