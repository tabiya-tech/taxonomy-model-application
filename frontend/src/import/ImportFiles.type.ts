import {ImportFileTypes} from "api-specifications/import";

export type ImportFiles = { [key in ImportFileTypes]?: File };