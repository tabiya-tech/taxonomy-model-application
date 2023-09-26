import type {Meta, StoryObj} from '@storybook/react';

import ModelsTable from "./ModelsTable";
import {
  getArrayOfFakeModels, getArrayOfFakeModelsForSorting,
  getArrayOfFakeModelsMaxLength, getOneFakeModel,
} from "./_test_utilities/mockModelData";
import {
  getAllImportProcessStatePermutations
} from "../importProcessStateIcon/_test_utilities/importProcesStateTestData";
import {useState} from "react";
import {SortConfig} from "./withSorting";
import {SortDirection} from "./withSorting.types";

export default {
  title: 'ModelDirectory/ModelsTable',
  component: ModelsTable,
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const sortingState = useState<SortConfig>({
        key: 'updatedAt',
        direction: SortDirection.DESCENDING
      });

      console.log('Sorting State: ', sortingState);

      return <Story sortingState={sortingState} />;
    },
  ],
} as Meta;

type Story = StoryObj<typeof ModelsTable>;

export const Shown: Story = {
  args: {
    models: getArrayOfFakeModels(10),
    isLoading: false
  },
};

export const ShownWithLongData: Story = {
  args: {
    models: getArrayOfFakeModelsMaxLength(10),
    isLoading: false
  },
};

export const ShownInLoadingState: Story = {
  args: {
    models: [],
    isLoading: true
  },
};

export const ShownWithDifferentImportStates: Story = {
  args: {
    models: getAllImportProcessStatePermutations().map((importProcessState, index) => {
      const model = getOneFakeModel(index);
      model.importProcessState = importProcessState;
      return model;
    }),
    isLoading: false
  }
}

export const ShownWithSorting: Story = {
  args: {
    models: getArrayOfFakeModelsForSorting(),
    isLoading: false
  }
}