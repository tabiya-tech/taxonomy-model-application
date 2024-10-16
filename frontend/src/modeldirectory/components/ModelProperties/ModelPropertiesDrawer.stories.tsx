import type { Meta } from "@storybook/react";
import ModelPropertiesDrawer from "./ModelPropertiesDrawer";
import { fakeModel } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";

const meta: Meta<typeof ModelPropertiesDrawer> = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesDrawer",
  component: ModelPropertiesDrawer,
  tags: ["autodocs"],
  argTypes: { notifyOnClose: { action: "notifyOnClose" } },
};

export const Shown = {
  args: {
    isOpen: true,
    model: fakeModel,
  },
};

export default meta;
