import {ModelInfoTypes} from "../../../modelInfo/modelInfoTypes";

export type SortableKeys = Extract<keyof ModelInfoTypes.ModelInfo, 'updatedAt' | 'name' | 'version'>; // Define the keys by which sorting can be done

export enum SortDirection {
  ASCENDING = 'ascending',
  DESCENDING = 'descending'
}
