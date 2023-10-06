import { ObjectTypes } from "esco/common/objectTypes";

export const expected = [
  {
    parentType: ObjectTypes.ISCOGroup,
    parentId: "mapped_key_1",
    childId: "mapped_key_2",
    childType: ObjectTypes.ISCOGroup,
  },
  {
    parentType: ObjectTypes.Occupation,
    parentId: "mapped_key_3",
    childId: "mapped_key_4",
    childType: ObjectTypes.Occupation,
  },
  {
    parentType: ObjectTypes.ISCOGroup,
    parentId: "mapped_key_5",
    childId: "mapped_key_6",
    childType: ObjectTypes.Occupation,
  },
];
