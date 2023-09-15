import ImportAPISpecs from "api-specifications/import";

export type ImportFiles = { [key in ImportAPISpecs.Constants.ImportFileTypes]?: File };