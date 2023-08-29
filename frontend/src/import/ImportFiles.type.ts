import {Constants as ImportConstants} from "api-specifications/import";

export type ImportFiles = { [key in ImportConstants.ImportFileTypes]?: File };