import type { Meta, StoryObj } from "@storybook/react";

import ModelsTable from "./ModelsTable";
import { getArrayOfFakeModels, getArrayOfFakeModelsMaxLength, getOneFakeModel } from "./_test_utilities/mockModelData";
import { getAllImportProcessStatePermutations } from "src/modeldirectory/components/ImportProcessStateIcon/_test_utilities/importProcesStateTestData";
import { getAllExportProcessStatePermutations } from "src/modeldirectory/components/ExportProcessStateIcon/_test_utilities/exportProcesStateTestData";

const meta: Meta<typeof ModelsTable> = {
  title: "ModelDirectory/ModelsTable/ModelsTable",
  component: ModelsTable,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ModelsTable>;

export const Shown: Story = {
  args: {
    models: getArrayOfFakeModels(20),
    isLoading: false,
    notifyOnExport: () => {},
  },
};

export const ShownWithLongData: Story = {
  args: {
    models: getArrayOfFakeModelsMaxLength(10),
    isLoading: false,
    notifyOnExport: () => {},
  },
};

export const ShownInLoadingState: Story = {
  args: {
    models: [],
    isLoading: true,
    notifyOnExport: () => {},
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
    notifyOnExport: () => {},
  },
};

export const ShownWithDifferentExportStates: Story = {
  args: {
    models: getAllExportProcessStatePermutations().map((exportProcessState, index) => {
      const model = getOneFakeModel(index + 1);
      model.exportProcessState = [exportProcessState];
      return model;
    }),
    isLoading: false,
    notifyOnExport: () => {},
  },
};
