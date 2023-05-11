export const expected = [
  {
    ESCOUri: "",
    originUUID: "",
    ISCOCode: "",
    preferredLabel: "",
    altLabels: [],
    description: ""
  },
  {
    ESCOUri: "",
    originUUID: "",
    ISCOCode: "",
    preferredLabel: "",
    altLabels: [],
    description: ""
  },
  {
    ESCOUri: "esco uri",
    originUUID: "origin uuid",
    ISCOCode: "isco code",
    preferredLabel: "preferred label",
    altLabels: ["label1", "label2"],
    description: "description"
  },
  {
    ESCOUri: "esco\n" +
      "uri\n" +
      "with\n" +
      "linebreak",
    originUUID: "origin\n" +
      "uuid\n" +
      "with\n" +
      "linebreak",
    ISCOCode: "isco\n" +
      "code\n" +
      "with\n" +
      "linebreak",
    preferredLabel: "preferred\n" +
      "label\n" +
      "with\n" +
      "linebreak",
    altLabels: ["label1", "label2"],
    description: "description\n" +
      "with\n" +
      "linebreak"
  }
];