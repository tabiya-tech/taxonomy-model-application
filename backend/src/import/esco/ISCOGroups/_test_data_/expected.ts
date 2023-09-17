import {INewISCOGroupSpec} from "esco/iscoGroup/ISCOGroup.types";

export const expected: Omit<INewISCOGroupSpec, "modelId">[] = [
  {
    ESCOUri: "esco uri",
    originUUID: "origin uuid",
    code: "01",
    preferredLabel: "preferred label",
    altLabels: ["label1", "label2"],
    description: "description",
    importId: "key_1"
  },
  {
    ESCOUri: "esco\nuri\nwith\nlinebreak",
    originUUID: "origin\nuuid\nwith\nlinebreak",
    code: "0101",
    preferredLabel: "preferred\nlabel\nwith\nlinebreak",
    altLabels: ["label1", "label2"],
    description: "description\nwith\nlinebreak",
    importId: "key_2"
  }
];