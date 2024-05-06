import { INewISCOGroupSpec } from "esco/iscoGroup/ISCOGroup.types";

export const expected: Omit<INewISCOGroupSpec, "modelId">[] = [
  {
    originUri: "origin uri",
    UUIDHistory: [],
    code: "01",
    preferredLabel: "preferred label",
    altLabels: ["label1", "label2"],
    description: "description",
    importId: "key_1",
  },
  {
    originUri: "esco\nuri\nwith\nlinebreak",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d", "b69710e0-7e7d-43ea-a645-26dab12faf83"],
    code: "0101",
    preferredLabel: "preferred\nlabel\nwith\nlinebreak",
    altLabels: ["label1", "label2"],
    description: "description\nwith\nlinebreak",
    importId: "key_2",
  },
  {
    originUri: "",
    UUIDHistory: ["632b3cac-515f-4260-b1d9-ea8674d5ded2"],
    code: "",
    preferredLabel: "",
    altLabels: [],
    description: "",
    importId: "key_3",
  },
  {
    originUri: "origin uri",
    UUIDHistory: ["b69710e0-7e7d-43ea-a645-26dab12faf8d", "b69710e0-7e7d-43ea-a645-26dab12faf56"],
    code: "0102",
    preferredLabel: "duplicate altLabels",
    altLabels: ["label1", "label2"],
    description: "description",
    importId: "key_4",
  },
];
