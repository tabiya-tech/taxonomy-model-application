import type { Meta, StoryObj } from "@storybook/react";

import ModelsTable from "./ModelsTable";
import { getArrayOfFakeModels, getArrayOfFakeModelsMaxLength, getOneFakeModel } from "./_test_utilities/mockModelData";
import { getAllImportProcessStatePermutations } from "../importProcessStateIcon/_test_utilities/importProcesStateTestData";

const meta: Meta<typeof ModelsTable> = {
  title: "ModelDirectory/ModelsTable",
  component: ModelsTable,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ModelsTable>;

export const Shown: Story = {
  args: {
    models: getArrayOfFakeModels(10),
    isLoading: false,
  },
};

export const ShownWithLongData: Story = {
  args: {
    models: getArrayOfFakeModelsMaxLength(10),
    isLoading: false,
  },
};

export const ShownInLoadingState: Story = {
  args: {
    models: [],
    isLoading: true,
  },
};

export const ShownWithDifferentImportStates: Story = {
  args: {
    models: getAllImportProcessStatePermutations().map((importProcessState, index) => {
      const model = getOneFakeModel(index + 1);
      model.importProcessState = importProcessState;
      return model;
    }),
    isLoading: false,
  },
};
