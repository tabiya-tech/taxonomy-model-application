import type { Meta } from "@storybook/react";
import ModelPropertiesDrawer from "./ModelPropertiesDrawer";
import { getOneFakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";

const meta: Meta<typeof ModelPropertiesDrawer> = {
  title: "ModelDirectory/ModelPropertiesDrawer",
  component: ModelPropertiesDrawer,
  tags: ["autodocs"],
  argTypes: { notifyOnClose: { action: "notifyOnClose" } },
};

export const Open = {
  args: {
    isOpen: true,
    model: getOneFakeModel(1),
  },
};

export default meta;
