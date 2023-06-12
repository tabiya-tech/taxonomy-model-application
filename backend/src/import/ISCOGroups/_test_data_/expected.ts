export const expected = [
  {
    ESCOUri: "",
    originUUID: "",
    code: "",
    preferredLabel: "",
    altLabels: [],
    description: ""
  },
  {
    ESCOUri: "",
    originUUID: "",
    code: "",
    preferredLabel: "",
    altLabels: [],
    description: ""
  },
  {
    ESCOUri: "esco uri",
    originUUID: "origin uuid",
    code: "isco code",
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
    code: "isco\n" +
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